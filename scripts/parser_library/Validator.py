# @what     Parsing library - Data Validator
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/12/17

from __future__ import print_function # NOTE: slowly move toward Python3

import os, sys, re, jsonschema, argparse, httplib, simplejson as json
from scripts.parser_library.Logger import Logger
from scripts.parser_library.internal_utils import *
from scripts.parser_library.internal_exceptions import JsonValidationError, JsonValidationWarning, JsonDuplicationWarning
# from scripts.parser_library.Updater import ProgressBar, Counter
from scripts.parser_library.Tracker import *

class Validator:
	def __init__(self, config, tracker=None):

		# Cache schema definitions into memory.
		schema_directory ='scripts/parser_library/schemas/'
		schema_directory = Validator.load_schema_directory(schema_directory)
		self.schemas = Validator.initiate_schemas(schema_directory)

		self.config = self.validate_config(config)
		self.course_code_regex = re.compile(self.config.course_code_regex)

		# Running tracker of validated course and section codes
		self.seen = {}
		# TODO - move to tracker

		if tracker is not None:
			self.tracker = tracker
		else:
			self.tracker = Tracker(self.config.school.code) # Used during self-contained validation.
			self.tracker.set_mode('validating')

		# Track stats throughout validation
		# self.count24 = 0.0
		# self.granularity = 60
		# TODO - report these values
		# self.tracker = Tracker()

	@staticmethod
	def load_schema_directory(directory):
		try:
			return os.environ['SEMESTERLY_HOME'] + '/' + directory
		except KeyError as e:
			raise KeyError('environment variable "SEMESTERLY_HOME" unset; try running: export SEMESTERLY_HOME=$(pwd)')

	@staticmethod
	def initiate_schemas(directory):
		load = lambda file: Validator.filepath_to_json(directory + file, allow_duplicates=True)
		resolve = lambda schema: jsonschema.RefResolver('file://' + directory, schema)
		schema_and_resolver = lambda schema: (schema, resolve(schema))
		# NOTE: it can be argued that in init loading all schemas directly to json
		#       is inefficient. However, it eliminates i/o overhead for successive
		#       calls without introducing complications of caching already read json.
		#       Schemas are not expected to exceed a reasonable size.
		return dotdict({
			'config'  : schema_and_resolver(load('config.json')),
			'datalist': schema_and_resolver(load('datalist.json')),
			'course'  : schema_and_resolver(load('course_only.json')),
			'section' : schema_and_resolver(load('section_only.json')),
			'meeting' : schema_and_resolver(load('meeting_only.json')),
			'directory': schema_and_resolver(load('directory.json'))
		})

	@staticmethod
	def validate_schema(subject, schema, resolver=None):
		jsonschema.Draft4Validator(schema, resolver=resolver).validate(subject)
		# TODO - Create iter_errors from jsonschema validator
		# except jsonschema.exceptions.SchemaError as e:
		# 	raise e
		# except jsonschema.exceptions.RefResolutionError as e:
		# 	raise e

	@staticmethod
	def filepath_to_json(file, allow_duplicates=False):
		'''Load file pointed to by path into json object dictionary.'''
		with open(file, 'r') as f:
			if allow_duplicates:
				return json.load(f)
			else:
				return json.loads(f.read(), object_pairs_hook=Validator.dict_raise_on_duplicates)

	def kind_to_validation_function(self, kind):
		return {
			'course'    : lambda x, schema=False: self.validate_course(x, schema=schema),
			'section'   : lambda x, schema=False: self.validate_section(x, schema=schema),
			'meeting'   : lambda x, schema=False: self.validate_meeting(x, schema=schema),
			'instructor': lambda x, schema=False: self.validate_instructor(x, schema=schema),
			'final_exam': lambda x, schema=False: self.validate_final_exam(x, schema=schema),
			'textbook'  : lambda x, schema=False: self.validate_textbook(x, schema=schema),
			'textbook_link': lambda x, schema=False: self.validate_textbook_link(x, schema=schema)
		}[kind]

	def validate(self, data):
		# Convert to dotdict for `easy-on-the-eyes` element access
		data = [ dotdict(d) for d in make_list(data) ]
		for obj in data:
			self.kind_to_validation_function(obj.kind)(obj, schema=True)

	def validate_self_contained(self, datafile,
		break_on_error=False,
		break_on_warning=False,
		output_error=None,
		hide_progress_bar=False):

		# Add functionality to tracker.
		self.tracker.add_viewer(LogFormatted())
		if not hide_progress_bar:
			formatter = lambda stats: '{}/{}'.format(stats['valid'], stats['total'])
			self.tracker.add_viewer(ProgressBar(self.config.school.code, formatter))
		self.tracker.start()

		self.logger = Logger(errorfile=output_error)

		try:
			# self.validate_directory(directory)
			data = Validator.filepath_to_json(datafile)
			Validator.validate_schema(data, *self.schemas.datalist)
		except (JsonValidationError, json.scanner.JSONDecodeError) as e:
			self.logger.log(e)
			raise e	# fatal error, cannot continue

		data = [ dotdict(d) for d in data ]

		# TODO - iter errors and catch exceptions within method
		for obj in data:
			try:
				self.kind_to_validation_function(obj.kind)(obj, schema=False)
				self.tracker.track_count(obj.kind, 'valid')
			except JsonValidationError as e:
				self.logger.log(e)
				if break_on_error:
					raise e
			except JsonValidationWarning as e:
				self.logger.log(e)
				if break_on_warning:
					raise e
			self.tracker.track_count(obj.kind, 'total')
			# TODO - delay tracker update to progress bar

		self.tracker.finish()

	def validate_config(self, config):
		if not isinstance(config, dict):
			try:
				config = Validator.filepath_to_json(config)
			except IOError as e:
				e.message += '\nconfig.json not defined'
				raise e
		return dotdict(config) # FIXME - dotdict should work here
		# Validator.validate_schema(config, *self.schemas.config)

	def validate_course(self, course, schema=True, relative=True):
		if not isinstance(course, dotdict):
			course = dotdict(course)

		if schema:
			Validator.validate_schema(course, *self.schemas.course)

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
			# NOTE: mutating dictionary
			section.course = { 'code': course.code }
			self.validate_section(section, schema=False)

		if relative:
			if course.code in self.seen:
				raise JsonDuplicationWarning('multiple definitions of course "%s"' % (course.code), course)
			if course.code not in self.seen:
				self.seen[course.code] = {}

	def validate_section(self, section, schema=True, relative=True):
		if not isinstance(section, dotdict):
			section = dotdict(section)

		if schema:
			Validator.validate_schema(section, *self.schemas.section)

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
			# NOTE: mutating dictionary
			meeting.course = section.course
			meeting.section = { 'code': section.code }
			self.validate_meeting(meeting, schema=False)

		if relative:
			if section.course.code not in self.seen:
				raise JsonValidationError('course code "%s" is not defined' % (section.course.code), section)
			elif section.code in self.seen[section.course.code] and \
			     section.year in self.seen[section.course.code][section.code] and \
			     section.term in self.seen[section.course.code][section.code][section.year]:
				raise JsonDuplicationWarning('multiple definitions for course "%s" section "%s" - %s already defined'
				 % (section.course.code, section.code, section.year), section)
			else:
				section_essence = {
					section.code: {
						section.year: {
							section.term
						}
					}	
				}

				update(self.seen[section.course.code], section_essence)

	def validate_meeting(self, meeting, schema=True, relative=True):
		if not isinstance(meeting, dotdict):
			meeting = dotdict(meeting)
		if schema:
			Validator.validate_schema(meeting, *self.schemas.meeting)
		if 'kind' in meeting and meeting.kind != 'meeting':
			raise JsonValidationError('meeting object must be of kind "instructor"', meeting)
		if 'course' in meeting and self.course_code_regex.match(meeting.course.code) is None:
			raise JsonValidationError('course code {} does not match regex \'{}\''
				.format(meeting.course.code, self.config.course_code_regex), meeting)
		if 'time' in meeting:
			try:
				self.validate_time_range(meeting.time)
			except (JsonValidationError, JsonValidationWarning) as e:
				e.message = 'meeting for %s %s, ' % (meeting.course.code, meeting.section.code) + e.message
				raise e
		if 'location' in meeting:
			try:
				self.validate_location(meeting.location)
			except JsonValidationError as e:
				e.message = 'meeting for %s %s, ' % (meeting.course.code, meeting.section.code) + e.message
				raise e
		if relative:
			if meeting.course.code not in self.seen:
				raise JsonValidationError('course code "%s" is not defined' % (meeting.course.code), meeting)
			if meeting.section.code not in self.seen[meeting.course.code]:
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

	def validate_textbook_link(self, textbook_link, schema=False, relative=True):
		if not isinstance(textbook_link, dotdict):
			textbook_link = dotdict(textbook_link)
		if 'course' in textbook_link and self.course_code_regex.match(textbook_link.course.code) is None:
			raise JsonValidationError('textbook_link course code does not match course code regex in config.json', textbook_link)

	def validate_location(self, location):
		if 'campus' in location and 'campuses' in self.config:
			if location.campus not in self.config.campuses:
				raise JsonValidationWarning('location at campus %s not defined in config.json campuses'
				 % (location.campus), location)
		if 'building' in location and 'buildings' in self.config:
			if location.building not in self.config.buildings:
				raise JsonValidationWarning('location at building %s not defined in config.json buildings'
				 % (location.building), location)

	def validate_website(url):
		'''Validate url by sending HEAD request and analyzing response.'''
		c = httplib.HTTPConnection(url)
		c.request("HEAD", '')
		# NOTE: 200 - good status
		#       301 - redirected
		if c.getresponse().status != 200 and c.getresponse().status != 301:
			raise JsonValidationError('invalid website w/url "%s"' % (url), {'url': url})

	# NOTE: somewhat redundant but readable
	def validate_time_range(self, time_range):
		start, end = time_range.start, time_range.end
		extract = lambda x: re.match(r'(\d{1,2}):(\d{2})', x)

		# Check individual time bounds
		for time in [start, end]:
			rtime = extract(time)
			hour, minute = int(rtime.group(1)), int(rtime.group(2))
			if hour > 23 or minute > 59:
				raise JsonValidationError('"%s" is not a valid time' %(time))
			self.tracker.track_time(hour, minute)
			# self.update_time_granularity(hour, minute)
			# if hour < 8 or hour > 20:
			# 	# NOTE: allows midnight times (00:00) to fly under the radar, unintended but useful hack
			# 	raise JsonValidationWarning('time range will not land on timetable', time_range)

		# Check interaction between times
		rstart = extract(start)
		rend = extract(end)
		start_hour, start_minute = int(rstart.group(1)), int(rstart.group(2))
		end_hour, end_minute = int(rend.group(1)), int(rend.group(2))
		for i in [start_hour, start_minute, end_hour, end_minute]:
			i = int(i)

		# NOTE: edge case if class going till midnight
		if (end_hour != 0 and start_hour > end_hour) or (start_hour == end_hour and start_minute > end_minute):
			raise JsonValidationError('start time is greater than end time', time_range)

		# NOTE: do this check after the others to give Errors higher priorities than Warnings 
		for time in [start, end]:
			hour, minute = int(rtime.group(1)), int(rtime.group(2))
			if hour < 8 or hour > 20:
				raise JsonValidationWarning('time range will not land on timetable', time_range)


		# # Count valid 24 hour times
		# if start_hour > 12 or end_hour > 12:
		# 	self.count24 += 1 # NOTE: should be changed to percentage

	# def update_time_granularity(self, hour, minute):
	# 	grain = 1
	# 	if minute % 60 == 0:
	# 		grain = 60
	# 	elif minute % 30 == 0:
	# 		grain = 30
	# 	elif minute % 20 == 0:
	# 		grain = 20
	# 	elif minute % 15 == 0:
	# 		grain = 15
	# 	elif minute % 10 == 0:
	# 		grain = 10
	# 	elif minute % 5 == 0:
	# 		grain = 5
	# 	elif minute % 3 == 0:
	# 		grain = 3
	# 	elif minute % 2 == 0:
	# 		grain = 2
	# 	else:
	# 		grain = 1
	# 	if grain < self.granularity:
	# 		self.granularity = grain

	def validate_directory(self, directory):
		if directory is None:
			print('cannot validate None directory', file=sys.stderr)
			exit(1) # FIXME -- should not exit w/in Validator, throw error or remove this altogether
		if isinstance(directory, str):
			try:
				name = directory
				directory = Validator.dir_to_dict(directory)
				directory['name'] = name
			except IOError as e:
				print('ERROR: invalid directory path\n' + str(e), file=sys.stderr)
				raise e
		Validator.validate_schema(directory, *self.schemas.directory)

	@staticmethod
	def dir_to_dict(path):
		d = {'name': os.path.basename(path)}
		if os.path.isdir(path):
			d['kind'] = "directory"
			d['children'] = [ Validator.dir_to_dict(os.path.join(path,x)) for x in os.listdir(path) ]
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

	@staticmethod
	def json_is_equal(a, b):
		a, b = json.dumps(a, sort_keys=True), json.dumps(b, sort_keys=True)
		return a == b
