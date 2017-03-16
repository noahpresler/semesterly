# @what     Parsing library Ingestor
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/13/17

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import sys
import simplejson as json, jsonschema
from pygments import highlight, lexers, formatters, filters
from scripts.parser_library.internal_utils import *

from scripts.parser_library.internal_exceptions import IngestorWarning
from scripts.parser_library.validator import Validator
from scripts.parser_library.internal_exceptions import JsonValidationError, JsonValidationWarning, JsonDuplicationWarning
from scripts.parser_library.Logger import Logger, JsonListLogger
from scripts.parser_library.Updater import Counter
from scripts.parser_library.Tracker import * # TODO - change to more specific when ready

class Ingestor(dict):
	ALL_KEYS = {
		'school',
		'kind',
		'department',
		'dept',
		'department_name',
		'department_code',
		'dept_name',
		'dept_code',
		'code',
		'course_code',
		'name',
		'course_name',
		'prerequisites',
		'prereqs',
		'corequisites',
		'coreqs',
		'exclusions',
		'description',
		'descr',
		'areas',
		'level',
		'cores',
		'geneds',
		'homepage',
		'website',
		'instructors',
		'instructors', 'instructor', 'instr', 'instrs', 'instr_name', 'instr_names', 'instructor', 'instructor_name',
		'section', 'sections', 'section_code', 'section_name', 'meeting_section',
		'section_type', 'type',
		'term',
		'semester',
		'year',
		'instructors',
		'capacity',
		'size', 'enrollment', 'enrolment',
		'waitlist', 'waitlist_size',
		'remaining_seats',
		'fees', 'fee',
		'final_exam',
		'offerings',
		'time_start',
		'start_time',
		'time_end',
		'end_time',
		'location',
		'loc', 'where',
		'days', 'day', 'dates', 'date',
		'time',
		'credits', 'num_credits',
		'campus', # NOTE: not really
		'textbooks',
		'isbn',
		'detail_url',
		'image_url',
		'author',
		'title',
		'required',
	}

	def __init__(self, school,
		validate=True,
		config=None, # TODO - non-intuitive meaning in context, conflicts with validate
		output_filepath=None,
		output_error_filepath=None,
		break_on_error=True, 
		break_on_warning=False,
		skip_shallow_duplicates=True,
		hide_progress_bar=False,
		tracker=NullTracker()):

		self.school = school
		self.validate = validate
		self.break_on_error = break_on_error
		self.break_on_warning = break_on_warning
		self.skip_shallow_duplicates = skip_shallow_duplicates

		# NOTE: unsure of where to put this, may belong in validator or in manage.py wrapper
		# FIXME -- validate that this directory actually exists and is correctly formatted
		directory = 'scripts/' + school
		if not config:
			config = '{0}/config.json'.format(directory)
		if not output_filepath:
			output_filepath = '{0}/data/courses.json'.format(directory)
		if not output_error_filepath:
			output_error_filepath = '{0}/logs/error.log'.format(directory)
 
		# Initialize loggers for json and errors
		self.logger = JsonListLogger(logfile=output_filepath, errorfile=output_error_filepath)
		# TODO - needs to default write to logs in school directory
		self.logger.open() # writes '[' at top of file

		# Setup tracker for digestion and progress bar.
		self.tracker = tracker
		self.tracker.set_mode('ingesting')
		if not hide_progress_bar:
			formatter = lambda stats: '{}/{}'.format(stats['valid'], stats['total'])
			self.tracker.add_viewer(ProgressBar(self.school, formatter))

		self.validator = Validator(config, tracker=self.tracker)

		super(Ingestor, self).__init__() # Adds dictionary functionality.

	def __str__(self):
		return '\n'.join('{}:{}'.format(l, v) for l, v in self.iteritems())

	def getchain(self, *keys):
		'''Match the first key found in self.mouth dictionary.'''
		for key in keys:
			if key in self:
				return self[key]
		return None

	def ingest_course(self):
		''' Create course json from info in model map.

		Returns:
			json object model for a course
		'''

		# support nested and non-nested department ingestion
		department = self.get('department')
		if ('department' not in self) or ('department_name' in self or 'department_code' in self or 'dept_name' in self or 'dept_code' in self):
			# if not isinstance(self.getchain('department', 'dept'), dict):
			department = {
				'name': self.getchain('department_name', 'dept_name'),
				'code': self.getchain('department_code', 'dept_code')
			}

		course = {
			'kind': 'course',
			'school': {
				'code': self.school
			},
			'code': self.getchain('code', 'course_code'),
			'name': self.getchain('name', 'course_name'),
			'department': department,
			'credits': self.getchain('credits', 'num_credits'),
			'prerequisites': deep_clean(make_list(self.getchain('prerequisites', 'prereqs'))),
			'corequisites': deep_clean(make_list(self.getchain('corequisites', 'coreqs'))),
			'exclusions': deep_clean(make_list(self.get('exclusions'))),
			'description': deep_clean(make_list(self.getchain('description', 'descr'))),
			'areas': deep_clean(self.get('areas')),
			'level': self.get('level'),
			'cores': deep_clean(make_list(self.get('cores'))),
			'geneds': deep_clean(make_list(self.get('geneds'))),
			'sections': self.get('sections'),
			'homepage': self.getchain('homepage', 'website'),
		}
		course = cleandict(course)
		self.validate_and_log(course)
		return course

	def ingest_section(self, course):
		''' Create section json object from info in model map. 

		Args:
			course: course info mapping

		Returns:
			json object model for a section
		'''

		# handle nested instructor definition and resolution
		instructors = None
		instr_keys = set(['instructors', 'instructor', 'instr', 'instrs', 'instr_name', 'instr_names', 'instructor', 'instructor_name', 'instructors']) & set(self)
		if len(instr_keys) == 0:
			pass
		elif len(instr_keys) > 1:
			raise IngestorWarning('cannot resolve instructors data ({})'.format(','.join(instr_keys)), self)
		else: # len(instr_keys) == 1
			instructors = self[list(instr_keys)[0]]
			instructors = deep_clean(make_list(instructors))
			for i in range(len(instructors)):
				if isinstance(instructors[i], basestring):
					instructors[i] = { 'name': instructors[i] }

		section = {
			'kind': 'section',
			'course': {
				'code': course['code']
			},
			'code': self.getchain('section_code', 'section', 'meeting_section'), # NOTE: design conflict with code in course
			'name': self.get('section_name'),
			'term': self.getchain('term', 'semester'),
			'year': self.get('year'), # NOTE: should be required # FIXME -- different years for parsed sections
			'instructors': instructors, #self.get('instructors'),
			'capacity': self.getchain('capacity', 'size'),
			'enrollment': self.getchain('enrollment', 'enrolment'), # NOTE: change to enrollment
			'waitlist': self.get('waitlist'),
			'waitlist_size': self.get('waitlist_size'),
			'remaining_seats': self.get('remaining_seats'),
			'type': self.getchain('type', 'section_type'),
			'fees': self.getchain('fees', 'fee'),
			'final_exam': self.get('final_exam'),
			'textbooks': self.get('textbooks'),
			'meetings': self.get('offerings')
		}

		section = cleandict(section)
		self.validate_and_log(section)
		return section

	def ingest_offerings(self, section):
		self.ingest_meeting(section)
	def ingest_offering(self, section):
		self.ingest_meeting(section)
	def ingest_meeting(self, section):
		''' Create meeting ingested json map.

		Args:
			section: section info mapping

		Returns:
			json object model for a meeting

		'''

		# handle nested time definition
		time = self.get('time')
		if 'time' not in self:
			time = {
				'start': self.getchain('time_start', 'start_time'),
				'end': self.getchain('time_end', 'end_time')
			}

		# handle nested location definition
		location = self.get('location')
		if isinstance(self.getchain('location', 'loc', 'where'), basestring):
			location = { 'where': self.getchain('location', 'loc', 'where') }

		meeting = {
			'kind': 'meeting',
			'course': section['course'],
			'section': {
				'code': section['code'],
				'year': self.get('year'),
				'term': self.getchain('term', 'semester')
			},
			'days': deep_clean(make_list(self.getchain('days', 'day'))),
			'dates': deep_clean(make_list(self.getchain('dates', 'date'))),
			'time': time,
			'location': location
		}

		meeting = cleandict(meeting)
		self.validate_and_log(meeting)
		return meeting

	def ingest_textbook_link(self, section=None):

		textbook_link = {
			'kind': 'textbook_link',
			'school': {
				'code': self.get('school_code')
			},
			'course': {
				'code': self.get('course_code')
			},
			'section': {
				'code': self.get('section_code'),
				'year': self.get('year'),
				'term': self.getchain('term', 'semester')
			},
			'isbn': self.get('isbn'),
			'required': self.get('required')
		}

		textbook_link = cleandict(textbook_link)
		self.validate_and_log(textbook_link)
		return textbook_link

	def ingest_textbook(self):
		''' Create textbook json object.
		Returns:
			json object model for textbook
		'''
		textbook = {
			'kind': 'textbook',
			'isbn': self.get('isbn'),
			'detail_url': self.get('detail_url'),
			'image_url': self.get('image_url'),
			'author': self.get('author'),
			'title': self.get('title')
		}

		textbook = cleandict(textbook)
		self.validate_and_log(textbook)
		return textbook

	def validate_and_log(self, obj):
		if self.validate:
			is_valid, skip = self.run_validator(obj)
			if skip:
				return
			if is_valid:
				self.logger.log(obj)
			# Ingestor warning
			try:
				for key in self:
					if key not in Ingestor.ALL_KEYS:
						raise IngestorWarning('Ingestor does not support key `%s`' % (str(key)), self)
			except IngestorWarning as e:
				is_valid = True
				self.logger.log(e)
				if self.break_on_warning:
					raise e
		else:
			self.logger.log(obj)
		self.tracker.track_count(obj['kind'], 'total')

	def run_validator(self, data):
		is_valid, full_skip = False, False
		try:
			self.validator.validate(data)
			# self.counter.increment(data['kind'], 'valid')
			self.tracker.track_count(data['kind'], 'valid')
			is_valid = True
		except jsonschema.exceptions.ValidationError as e:
			# Wrap error along with json object in another error
			e = JsonValidationError(str(e), data)
			self.logger.log(e)
			if self.break_on_error:
				raise e
		except JsonValidationError as e:
			self.logger.log(e)
			if self.break_on_error:
				raise e
		except (JsonValidationWarning, JsonDuplicationWarning) as e:
			if isinstance(e, JsonDuplicationWarning) and self.skip_shallow_duplicates:
				full_skip = True # NOTE: potentially hides inefficient and redundant scraper design
			else:
				is_valid = True
				self.logger.log(e)
				if self.break_on_warning:
					raise e
		return is_valid, full_skip

	def wrap_up(self):
		self.logger.close()
		self.clear()
