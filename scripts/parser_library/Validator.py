# @what     Parsing library - Validator
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/12/17

# https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.4.3
# http://json-schema.org/
# https://spacetelescope.github.io/understanding-json-schema/reference/combining.html

import os, sys, re, jsonschema, argparse, httplib
import simplejson as json
from pygments import highlight, lexers, formatters, filters

# TODO - move to own file
class dotdict(dict):
	"""dot.notation access to dictionary attributes"""
	__getattr__ = dict.get
	__setattr__ = dict.__setitem__
	__delattr__ = dict.__delitem__

	def __init__(self, dct):
		for key, value in dct.items():
			if hasattr(value, 'keys'):
				value = dotdict(value)
			self[key] = value

class Validator:
	def __init__(self,
		directory=None,
		schema_directory='scripts/parser_library/schemas/', 
		error_log_filename='/dev/null'):

		self.logger = Logger(error_log_filename)
		self.directory = directory
		self.schema_directory = schema_directory

		self.validated_course_codes = {}

		self.count24 = 0
		self.granularity = 60

		resolve = lambda schema: jsonschema.RefResolver('file://' + self.schema_directory, schema)
		load = lambda schema: file_to_json(self.directory + schema)
		self.schema = dotdict({
			'all': {
				'schema': file_to_json('data/courses.json'),
				'resolver': resolve('courses.json')
			},
			'config'
		})

	@staticmethod
	def create_jsonschema_resolver(schema, schema_directory='scripts/parser_library/schemas/'):
		resolver = jsonschema.RefResolver('file://' + schema_directory, schema)
		return resolver

	def jsonschema_validate(self, schema_directory, schema, subject):
		if isinstance(schema, str):
			schema = self.file_to_json(schema, allow_duplicates=True)
		if isinstance(subject, str):
			subject = self.file_to_json(subject)

		# Set JSON Schema $ref resolver
		resolver = Validator.create_jsonschema_resolver(schema, schema_directory)
		try:
			jsonschema.Draft4Validator(schema.schema, resolver=schema.resolver).validate(subject)
		except jsonschema.ValidationError as error:
			self.logger.log('SUBJECT_DEFINITION', error, 
				path=schema_directory,
				schema=schema,
				subject=subject)
		except jsonschema.exceptions.SchemaError as error:
			self.logger.log('SCHEMA_DEFINITION', error,
				path=schema_directory,
				schema=schema,
				subject=subject)
		except Exception as error:
			self.logger.log('UNKNOWN', error,
				path=schema_directory,
				schema=schema,
				subject=subject)

		return subject

	def file_to_json(self, file, allow_duplicates=False):
		j = None
		with open(file, 'r') as f:
			try:
				if allow_duplicates:
					j = json.load(f)
				else:
					j = json.loads(f.read(), object_pairs_hook=Validator.dict_raise_on_duplicates)
			except ValueError as e:
				print file
				self.logger.log('INVALID_JSON', e)
				return None
		return j

	def validate(self):
		# helpers
		schema = lambda f: self.schema_directory + f
		subject = lambda f: self.directory + f

		self.config = self.jsonschema_validate(self.schema.config, file_to_json(self.schema_directory + 'config.json'))
		print Validator.pretty_json(self.config)


		# self.jsonschema_validate(self.schema.config, 'data/courses.json')
		# self.config = self.jsonschema_validate(self.schema_directory, schema('config.json'), subject('config.json'))
		# courses = self.jsonschema_validate(self.schema_directory, schema('courses.json'), subject('data/courses.json'))

		courses = self.jsonschema_validate(self.schema.config, file_to_json(self.directory + 'data/courses.json'))
		self.course_code_regex = re.compile(self.config['course_code_regex'])

		for obj in courses:
			try:
				{
					'course': lambda x: self.validate_course(x, validate_schema=False),
					'section': lambda x: self.validate_section(x, validate_schema=False),
					'meeting': lambda x: self.validate_meeting(x, validate_schema=False),
					'instructor': lambda x: self.validate_instructor(x, validate_schema=False),
					'final_exam': lambda x: self.validate_final_exam(x, validate_schema=False),
					'textbook': lambda x: self.validate_textbook(x, validate_schema=False),
					'textbook_link': lambda x: self.validate_textbook_link(x, validate_schema=False)
				}[obj['kind']](obj)`
			except ValueError as error:
				print 'ERROR:', error
				print Validator.pretty_json(obj)

	def validate_course(self, course, validate_schema=True, enforce_relative_order=True):
		try:
			if validate_schema:
				self.jsonschema_validate(self.schema.course, course)

			if enforce_relative_order:
				pass # TODO

			if 'kind' in course and course['kind'] != 'course':
				raise ValueError('course object must be of kind course')

			if self.course_code_regex.match(course['code']) is None:
				raise ValueError('course code "%s" does not match r\'%s\''
				 %(course['code'], self.config['course_code_regex']))

			if 'department' in course and 'code' in course['department'] and 'departments' in self.config:
				if course['department']['code'] not in {d['code'] for d in self.config['departments']}:
					raise ValueError('department %s is not in config.json department list'
					 %(course['department']))

			if 'homepage' in course:
				validate_website(course['homepage'])

			for section in course.get('sections', []):
				if 'course' in section and section['course']['code'] != course['code']:
					raise ValueError('course code "%s" in nested section does not match parent course code "%s"'
					 % (section['course']['code'], course['code']))
				# NOTE: mutating dictionary
				section['course'] = { 'code': course['code'] }
				self.validate_section(section)

		except ValueError as error:
			raise ValueError("in course %s, %s" % (course['code'], str(error)))

	def validate_section(self, section, schema=False, enforce_relative_order=True):
		try:
			if 'kind' in section and section['kind'] != 'section':
				raise ValueError('section object must be of kind "section"')

			if 'course' in section and self.course_code_regex.match(section['course']['code']) is None:
				raise ValueError('course code "%s" does not match r\'%s\''
				 %(course['code'], self.config['course_code_regex']))

			if 'term' in section and section['term'] not in self.config['terms']:
				raise ValueError('term "%s" not in config.json term list' % (section['term']))

			for instructor in section.get('instructors', []):
				# TODO
				self.validate_instructor(instructor)

			if 'final_exam' in section:
				if 'course' in section['final_exam'] and section['final_exam']['course']['code'] != section['course']['code']:
					raise ValueError('section final exam course "%s" does not match section course "%s"'
					 % (section['final_exam']['course']['code'], section['course']['code']))
				if 'section' in section['final_exam'] and section['final_exam']['section']['code'] != section['code']:
					raise ValueError('section final exam section code "%s" does not match section code "%s"'
					 % (section['final_exam']['section']['code'], section['code']))
				self.validate_final_exam(section['final_exam'])

			for meeting in section.get('meetings', []):
				if 'course' in meeting and meeting['course']['code'] != section['course']['code']:
					raise ValueError('course code "%s" in nested meeting does not match parent section course code "%s"'
					 % (meeting['course']['code'], section['course']['code']))
				if 'section' in meeting and meeting['section']['code'] != section['code']:
					raise ValueError('section code "%s" in nested meeting does not match parent section code "%s"'
					 % (meeting['section']['code'], section['code']))
				# NOTE: mutating dictionary
				meeting['course'] = section['course']
				meeting['section'] = { 'code': section['code'] }
				self.validate_meeting(meeting)

		except ValueError as error:
			raise ValueError('in section "%s", %s' % (section['code'], str(error)))

	def validate_meeting(self, meeting, schema=False, enforce_relative_order=True):
		if 'kind' in meeting and meeting['kind'] != 'meeting':
			raise ValueError('meeting object must be of kind "instructor"')
		if 'course' in meeting and self.course_code_regex.match(meeting['course']['code']) is None:
			raise ValueError('course code "%s" does not match r\'%s\''
			 % (course['code'], self.config['course_code_regex']))
		if 'time' in meeting:
			self.validate_time_range(meeting['time']['start'], meeting['time']['end'])
		if 'location' in meeting:
			self.validate_location(meeting['location'])

	def validate_location(self, location):
		if 'campus' in location and 'campuses' in self.config:
			if location['campus'] not in self.config['campuses']:
				raise ValueError('location at campus %s not defined in config.json campuses'
				 % (location['campus']))
		if 'building' in location and 'buildings' in self.config:
			if location['building'] not in self.config['buildings']:
				raise ValueError('location at building %s not defined in config.json buildings'
				 % (location['building']))

	def validate_instructor(self, instructor, schema=False, enforce_relative_order=True):
		if 'kind' in instructor and instructor['kind'] != 'instructor':
			raise ValueError('instructor object must be of kind instructor')

		for _class in instructor.get('classes', []):
			if 'course' in _class and self.course_code_regex.match(_class['course']['code']) is None:
				raise ValueError('course code "%s" does not match given regex "%s"'
				 % (_class['course']['code'], self.config['course_code_regex']))

		if 'department' in instructor and 'departments' in self.config:
			if instructor['department'] not in { d['code'] for d in self.config['departments'] }:
				raise ValueError('department %s not listed in config.json' % (instructor['department']))

		if 'homepage' in instructor:
			self.validate_homepage(instructor['homepage'])

		if 'office' in instructor:
			if 'location' in instructor['office']:
				self.validate_location(instructor['office']['location'])
			for office_hour in instructor['office'].get('hours', []):
				self.validate_meeting(instructor['office']['hours'])

	def validate_final_exam(self, final_exam, schema=False, enforce_relative_order=True):
		if 'kind' in final_exam and final_exam['kind'] != 'final_exam':
			raise ValueError('final_exam object must be of kind "final_exam"')

	def validate_website(url):
		c = httplib.HTTPConnection(url)
		c.request("HEAD", '')
		if c.getresponse().status != 200:
			raise ValueError('invalid website url "%s"' % (url))

	def validate_textbook(self, textbook):
		pass # TODO

	def validate_texbook_link(self, textbook_link):
		pass # TODO

	# NOTE: somewhat redundant but readable
	def validate_time_range(self, start, end):
		match = lambda x: re.match(r'(\d{1,2}):(\d{2})', x)

		# Check individual time bounds
		for time in [start, end]:
			rtime = match(time)
			hour, minute = int(rtime.group(1)), int(rtime.group(2))
			if hour > 23 or minute > 59:
				raise ValueError('"%s" is not a valid time' %(time))
			self.update_time_granularity(hour, minute)
			if hour < 8 or hour > 20:
				pass # TODO - warn that will not be on timetable

		# Check interaction between times
		rstart = match(start)
		rend = match(end)
		start_hour, start_minute = int(rstart.group(1)), int(rstart.group(2))
		end_hour, end_minute = int(rend.group(1)), int(rend.group(2))
		for i in [start_hour, start_minute, end_hour, end_minute]:
			i = int(i)

		if start_hour > end_hour or (start_hour == end_hour and start_minute > end_minute):
			raise ValueError('start time "%s" is greater than end time "%s"' % (start, end))

		# Count valid 24 hour times
		if start_hour > 12 or end_hour > 12:
			self.count24 += 1 # NOTE: should be changed to percentage

	def update_time_granularity(self, hour, minute):
		grain = 1
		if minute % 60 == 0:
			grain = 60
		elif minute % 30 == 0:
			grain = 30
		elif minute % 20 == 0:
			grain = 20
		elif minute % 15 == 0:
			grain = 15
		elif minute % 10 == 0:
			grain = 10
		elif minute % 5 == 0:
			grain = 5
		elif minute % 3 == 0:
			grain = 3
		elif minute % 2 == 0:
			grain = 2
		else:
			grain = 1
		if grain < self.granularity:
			self.granularity = grain

	def validate_directory(self):
		if self.directory is None:
			return

		resolver = jsonschema.RefResolver('file://' + self.absolute_path_to_schema_base_directory, self.directory)
		directory = Validator.path_to_dict(self.directory)

		with open(os.path.join(self.absolute_path_to_schema_base_directory, 'directory.json'), 'r') as f:
			try:
				self.directory_schema = json.load(f)
			except ValueError as e:
				self.logger.log('DIRECTORY_SCHEMA_JSON', e)
				exit(1)

		print self.directory_schema.get('')
		print directory.get('')
		jsonschema.Draft4Validator(self.directory_schema, resolver=resolver).validate(directory)

		try:
			pass
		except jsonschema.ValidationError as error:
			self.logger.log('DIRECTORY_VALIDATION', error)
		except jsonschema.exceptions.SchemaError as error:
			self.logger.log('DIRECTORY_SCHEMA', error)
		except Exception as error:
			self.logger.log('UNKNOWN', error)

	@staticmethod
	def pretty_json(j):
		if isinstance(j, dict):
			j = json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
		l = lexers.JsonLexer()
		l.add_filter('whitespace')
		colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
		return colorful_json

	@staticmethod
	def path_to_json(path):
		return Validator.dict_to_json(Validator.path_to_dict(path))

	@staticmethod
	def dict_to_json(d):
		return json.dumps(d)

	@staticmethod
	def path_to_dict(path):
		d = {'name': os.path.basename(path)}
		if os.path.isdir(path):
			d['kind'] = "directory"
			d['children'] = [Validator.path_to_dict(os.path.join(path,x)) for x in os.listdir(path)]
		else:
			d['kind'] = "file"
		return d

	@staticmethod
	def dict_raise_on_duplicates(ordered_pairs):
		"""Reject duplicate keys in dictionary."""
		d = {}
		for k, v in ordered_pairs:
			if k in d:
				 raise ValueError("duplicate key: %r" % (k,))
			else:
				 d[k] = v
		return d

class Logger:
	def __init__(self, filename):
		self.file = open(filename, 'w+')
 
	def log(self, type, error, note='', **kwargs):
		message = {
			'INVALID_JSON': lambda e: ValidationError.invalid_json_error(e),
			'SCHEMA_JSON': lambda e: ValidationError.schema_json_error(e),
			'SCHEMA_DEFINITION': lambda e: ValidationError.schema_definition_error(e),
			'SUBJECT_JSON': lambda e: ValidationError.subject_json_error(e),
			'SUBJECT_DEFINITION': lambda e: ValidationError.subject_definition_error(e),
			'EXTENDED': lambda e: ValidationError.extended_definition_error(e),
			'UNKNOWN': lambda e: ValidationError.unknown_error(e)
		}.get(type)

		if not message:
			print 'TODO - "' + type + '" ERROR NOT DEALT WITH'
			print error
			return

		message = message(error)
		self.file.write(str(message))
		print message
		print error

class ValidationError:
	@staticmethod
	def schema_json_error(error):
		print 'SCHEMA_JSON'

	@staticmethod
	def schema_definition_error(error):
		print 'SCHEMA_DEFINITION'

	@staticmethod
	def subject_json_error(error):
		print 'SUBJECT_JSON'

	@staticmethod
	def subject_definition_error(error):
		print 'SUBJECT_DEFINITION'

	@staticmethod
	def extended_definition_error(error):
		print 'EXTENDED DEFINITION'

	@staticmethod
	def unknown_error(error):
		print 'UNKNOWN'

	@staticmethod
	def invalid_json_error(error):
		print 'INVALID JSON'

def get_args():
	pass

def check_args(args):
	pass

def main():
	v = Validator(
		schema_directory='/home/mike/Documents/semesterly/scripts/parser_library/schemas/',
		directory='/home/mike/Documents/semesterly/scripts/parser_library/ex_school/')

	v.validate()

if __name__ == '__main__':
	main()