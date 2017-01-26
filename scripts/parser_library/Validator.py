# @what     Parsing library - Validator
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/12/17

import os, sys, re, jsonschema, argparse, httplib
import simplejson as json
from Logger import Logger
from InternalUtils import *

class Validator:
	def __init__(self,
		directory=None,
		schema_directory='scripts/parser_library/schemas/',
		log_filename='/dev/null'):

		try:
			schema_directory = os.environ['SEMESTERLY_HOME'] + '/' + schema_directory
		except KeyError as error:
			sys.stderr.write('environment variable "SEMESTERLY_HOME" unset \ntry running:\nexport SEMESTERLY_HOME=$(pwd)\n')
			exit(1)

		if directory is None:
			raise NotImplementedError('school directory must be defined as of now')

		self.logger = Logger(log_filename)
		self.directory = directory
		self.schema_directory = schema_directory

		# Running tracker of validated course and section codes
		self.validated = {}

		self.count24 = 0.0
		self.granularity = 60

		load = lambda file: self.file_to_json(self.schema_directory + file, allow_duplicates=True)
		resolve = lambda schema: jsonschema.RefResolver('file://' + self.schema_directory, schema)
		schema_and_resolver = lambda schema: (schema, resolve(schema))
		# NOTE: it can be argued that in init loading all schemas directly to json
		#       is inefficient. However, it eliminates i/o overhead for successive
		#       calls without introducing complications of caching read json.
		#       Schemas are not expected to exceed a reasonable size.
		self.schema = dotdict({
			'config'  : schema_and_resolver(load('config.json')),
			'datalist': schema_and_resolver(load('datalist.json')),
			'course'  : schema_and_resolver(load('course_only.json')),
			'section' : schema_and_resolver(load('section_only.json')),
			'meeting' : schema_and_resolver(load('meeting_only.json'))
		})

		# TODO - directory validation

		config = self.file_to_json(self.directory + 'config.json')
		self.validate_schema(config, *self.schema.config)
		self.config = dotdict(config)
		self.course_code_regex = re.compile(self.config.course_code_regex)

	def validate_schema(self, subject, schema, resolver=None):
		try:
			jsonschema.Draft4Validator(schema, resolver=resolver).validate(subject)
		except jsonschema.ValidationError as error:
			self.logger.log('SUBJECT_DEFINITION', error, 
				schema=schema,
				subject=subject)
		except jsonschema.exceptions.SchemaError as error:
			self.logger.log('SCHEMA_DEFINITION', error,
				schema=schema,
				subject=subject)
		# except RefResolutionError as error: # TODO
		# 	self.logger.log('UNKNOWN', error,
		# 		schema=schema,
		# 		subject=subject)

		# return subject # TODO - modifier vs accessor conventions?

	def file_to_json(self, file, allow_duplicates=False):
		j = None
		with open(file, 'r') as f:
			try:
				if allow_duplicates:
					j = json.load(f)
				else:
					j = json.loads(f.read(), object_pairs_hook=Validator.dict_raise_on_duplicates)
			except json.scanner.JSONDecodeError as e:
				print file
				self.logger.log('INVALID_JSON', e)
				return None
		return j

	def validate(self):
		datalist = self.file_to_json(self.directory + 'data/courses.json')
		self.validate_schema(datalist, *self.schema.datalist)
		datalist = [ dotdict(data) for data in datalist ]

		for obj in datalist:
			try:
				{
					'course'    : lambda x: self.validate_course(x, schema=False),
					'section'   : lambda x: self.validate_section(x, schema=False),
					'meeting'   : lambda x: self.validate_meeting(x, schema=False),
					'instructor': lambda x: self.validate_instructor(x, schema=False),
					'final_exam': lambda x: self.validate_final_exam(x, schema=False),
					'textbook'  : lambda x: self.validate_textbook(x, schema=False),
					'textbook_link': lambda x: self.validate_textbook_link(x, schema=False)
				}[obj.kind](obj)
			except JsonValidationError as error:
				print 'ERROR:', error.message
				print pretty_json(error.json)

	def validate_course(self, course, schema=True, relative=True):
		if not isinstance(course, dotdict):
			course = dotdict(course)

		if schema:
			self.validate_schema(course, *self.schema.course)

		if 'kind' in course and course.kind != 'course':
			raise JsonValidationError('course object must be of kind course', course)

		if self.course_code_regex.match(course.code) is None:
			raise JsonValidationError('course code "%s" does not match regex \'%s\''
			 %(course.code, self.config.course_code_regex), course)

		if 'department' in course and 'code' in course.department and 'departments' in self.config:
			if course.department.code not in {d.code for d in self.config.departments}:
				raise JsonValidationError('department %s is not in config.json department list'
				 %(course.department), course)

		if 'homepage' in course:
			validate_website(course.homepage)

		for section in course.get('sections', []):
			if 'course' in section and section.course.code != course.code:
				raise JsonValidationError('course code "%s" in nested section does not match parent course code "%s"'
				 % (section.course.code, course.code), course)
			# NOTE: mutating dictionary; TODO - not needed anymore, remove when able
			section.course = { 'code': course.code }
			self.validate_section(section, schema=False)

		if relative:
			if course.code in self.validated:
				self.validation_warning('multiple definitions of course "%s"' % (course.code), course) # TODO - should be warning
			if course.code not in self.validated:
				self.validated[course.code] = set()

	def validate_section(self, section, schema=True, relative=True):
		if not isinstance(section, dotdict):
			section = dotdict(section)

		if schema:
			self.validate_schema(section, *self.schema.section)

		if 'course' not in section:
			raise JsonValidationError('section does not define a parent course', section)

		if 'kind' in section and section.kind != 'section':
			raise JsonValidationError('section object must be of kind "section"', section)

		if 'course' in section and self.course_code_regex.match(section.course.code) is None:
			raise JsonValidationError('course code "%s" does not match r\'%s\''
			 %(section.course.code, self.config.course_code_regex), section)

		if 'term' in section and section.term not in self.config.terms:
			raise JsonValidationError('term "%s" not in config.json term list' % (section.term), section)

		for instructor in section.get('instructors', []):
			self.validate_instructor(instructor)

		if 'final_exam' in section:
			if 'course' in section.final_exam and section.final_exam.course.code != section.course.code:
				raise JsonValidationError('section final exam course "%s" does not match section course code "%s"'
				 % (section.final_exam.course.code, section.course.code), section)
			if 'section' in section.final_exam and section.final_exam.section.code != section.code:
				raise JsonValidationError('section final exam section code "%s" does not match section code "%s"'
				 % (section.final_exam.section.code, section.code), section)
			final_exam['course'] = section.course
			final_exam['section'] = { 'code': section.code }
			self.validate_final_exam(section.final_exam)

		for meeting in section.get('meetings', []):
			if 'course' in meeting and meeting.course.code != section.course.code:
				raise JsonValidationError('course code "%s" in nested meeting does not match parent section course code "%s"'
				 % (meeting.course.code, section.course.code), section)
			if 'section' in meeting and meeting.section.code != section.code:
				raise JsonValidationError('section code "%s" in nested meeting does not match parent section code "%s"'
				 % (meeting.section.code, section.code), section)
			# NOTE: mutating dictionary; TODO - not needed anymore, remove when able
			meeting.course = section.course
			meeting.section = { 'code': section.code }
			self.validate_meeting(meeting, schema=False)

		if relative:
			if section.course.code not in self.validated:
				raise JsonValidationError('course code "%s" is not defined' % (section.course.code), section)
			if section.code in self.validated[section.course.code]:
				self.validation_warning('for course "%s" section "%s" already defined'
				 % (section.course.code, section.code), section)
			self.validated[section.course.code].add(section.code)

	def validation_warning(self, message, j):
		print 'WARNING:', message
		print pretty_json(j)

	def validate_meeting(self, meeting, schema=True, relative=True):
		if not isinstance(meeting, dotdict):
			meeting = dotdict(meeting)
		if schema:
			self.validate_schema(meeting, *self.schema.meeting)
		if 'kind' in meeting and meeting.kind != 'meeting':
			raise JsonValidationError('meeting object must be of kind "instructor"', meeting)
		if 'course' in meeting and self.course_code_regex.match(meeting.course.code) is None:
			raise JsonValidationError('course code "%s" does not match regex \'%s\''
			 % (course.code, self.config.course_code_regex), meeting)
		if 'time' in meeting:
			try:
				self.validate_time_range(meeting.time)
			except JsonValidationError as e:
				e.message = 'meeting for %s %s, ' % (meeting.course.code, meeting.section.code) + e.message
				raise e
		if 'location' in meeting:
			try:
				self.validate_location(meeting.location)
			except JsonValidationError as e:
				e.message = 'meeting for %s %s, ' % (meeting.course.code, meeting.section.code) + e.message
				raise e
		if relative:
			if meeting.course.code not in self.validated:
				raise JsonValidationError('course code "%s" is not defined' % (meeting.course.code), meeting)
			if meeting.section.code not in self.validated[meeting.course.code]:
				raise JsonValidationError('section "%s" is not defined' % (meeting.section.code), meeting)

	def validate_instructor(self, instructor, schema=False, relative=True):
		if not isinstance(instructor, dotdict):
			instructor = dotdict(instructor)
		if 'kind' in instructor and instructor.kind != 'instructor':
			raise JsonValidationError('instructor object must be of kind instructor', instructor)

		for _class in instructor.get('classes', []):
			if 'course' in _class and self.course_code_regex.match(_class.course.code) is None:
				raise JsonValidationError('course code "%s" does not match given regex "%s"'
				 % (_class.course.code, self.config.course_code_regex), instructor)

		if 'department' in instructor and 'departments' in self.config:
			if instructor.department not in { d.code for d in self.config.departments }:
				raise JsonValidationError('department %s not listed in config.json'
				 % (instructor.department), instructor)

		if 'homepage' in instructor:
			try:
				self.validate_homepage(instructor.homepage)
			except JsonValidationError as e:
				e.message = '@instructor %s\'s office, ' % (instructor.name) + e.message
				raise e

		if 'office' in instructor:
			try:
				if 'location' in instructor.office:
					self.validate_location(instructor.office.location)
				for office_hour in instructor.office.get('hours', []):
					self.validate_meeting(office_hour)
			except JsonValidationError as e:
				e.message = '@instructor %s\'s office, ' % (instructor.name) + e.message
				raise e

	def validate_final_exam(self, final_exam, schema=False, relative=True):
		if not isinstance(final_exam, dotdict):
			final_exam = dotdict(final_exam)
		if 'kind' in final_exam and final_exam.kind != 'final_exam':
			raise JsonValidationError('final_exam object must be of kind "final_exam"', final_exam)
		try:
			self.validate_meeting(final_exam.meeting)
		except JsonValidationError as e:
			e.message = '@final_exam ' + e.message
			raise e

	def validate_textbook(self, textbook, schema=False, relative=True):
		if not isinstance(textbook, dotdict):
			textbook = dotdict(textbook)
		pass # TODO

	def validate_texbook_link(self, textbook_link, schema=False, relative=True):
		if not isinstance(textbook_link, dotdict):
			textbook_link = dotdict(textbook_link)
		if 'course' in textbook_link and self.course_code_regex.match(meeting.course.code) is None:
			raise JsonValidationError('textbook_link course code does not match course code regex in config.json', textbook_link)

	def validate_location(self, location):
		if 'campus' in location and 'campuses' in self.config:
			if location.campus not in self.config.campuses:
				raise JsonValidationError('location at campus %s not defined in config.json campuses'
				 % (location.campus), location)
		if 'building' in location and 'buildings' in self.config:
			if location.building not in self.config.buildings:
				raise JsonValidationError('location at building %s not defined in config.json buildings'
				 % (location.building), location)

	def validate_website(url):
		c = httplib.HTTPConnection(url)
		c.request("HEAD", '')
		if c.getresponse().status != 200:
			raise JsonValidationError('invalid website url "%s"' % (url), {'url': url})

	# NOTE: somewhat redundant but readable
	def validate_time_range(self, time):
		start, end = time.start, time.end
		match = lambda x: re.match(r'(\d{1,2}):(\d{2})', x)

		# Check individual time bounds
		for time in [start, end]:
			rtime = match(time)
			hour, minute = int(rtime.group(1)), int(rtime.group(2))
			if hour > 23 or minute > 59:
				raise JsonValidationError('"%s" is not a valid time' %(time))
			self.update_time_granularity(hour, minute)
			if hour < 8 or hour > 20:
				self.validation_warning('time range will not land on timetable', time)
				pass # TODO - warn that will not be on timetable

		# Check interaction between times
		rstart = match(start)
		rend = match(end)
		start_hour, start_minute = int(rstart.group(1)), int(rstart.group(2))
		end_hour, end_minute = int(rend.group(1)), int(rend.group(2))
		for i in [start_hour, start_minute, end_hour, end_minute]:
			i = int(i)

		if start_hour > end_hour or (start_hour == end_hour and start_minute > end_minute):
			raise JsonValidationError('start time is greater than end time', time)

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
			except JsonValidationError as e:
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
			d['children'] = [ Validator.path_to_dict(os.path.join(path,x)) for x in os.listdir(path) ]
		else:
			d['kind'] = "file"
		return d

	@staticmethod
	def dict_raise_on_duplicates(ordered_pairs):
		"""Reject duplicate keys in dictionary."""
		d = {}
		for k, v in ordered_pairs:
			if k in d:
				 raise JsonValidationError("duplicate key: %r" % (k,))
			else:
				 d[k] = v
		return d

class JsonValidationError(ValueError):
	'''Raise when fails validation condition.'''

	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json
		super(JsonValidationError, self).__init__(message, message, json, *args)

	@staticmethod
	def schema_json_error(error):
		print 'SCHEMA_JSON'
		print error

	@staticmethod
	def schema_definition_error(error):
		print 'SCHEMA_DEFINITION'
		print error

	@staticmethod
	def subject_json_error(error):
		print 'SUBJECT_JSON'
		print error

	@staticmethod
	def subject_definition_error(error):
		print 'SUBJECT_DEFINITION'
		print error

	@staticmethod
	def extended_definition_error(error):
		print 'EXTENDED DEFINITION'
		print error

	@staticmethod
	def unknown_error(error):
		print 'UNKNOWN'
		print error

	@staticmethod
	def invalid_json_error(error):
		print 'INVALID JSON'
		print error

def get_args():
	pass

def check_args(args):
	pass

def main():
	v = Validator(
		schema_directory='scripts/parser_library/schemas/',
		directory='scripts/parser_library/ex_school/')

	v.validate()

if __name__ == '__main__':
	main()