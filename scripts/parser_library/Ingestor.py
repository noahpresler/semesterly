# @what     Parsing library Ingestor
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/13/17

import simplejson as json, jsonschema
from pygments import highlight, lexers, formatters, filters
from scripts.parser_library.Validator import Validator
from scripts.parser_library.internal_exceptions import JsonValidationError, JsonValidationWarning
from internal_utils import *
from scripts.parser_library.Logger import Logger, JsonListLogger

class Ingestor:
	def __init__(self, school,
		update_progress=lambda *args, **kwargs: None, # noop
		config=None, # TODO - non-intuitive meaning in context, conflicts with validate
		validate=True,
		output_filepath=None,
		output_error_filepath=None,
		break_on_error=True, 
		break_on_warning=False):

		self.school = school
		self.validate = bool(config) and validate
		self.break_on_error = break_on_error
		self.break_on_warning = break_on_warning
		self.update_progress = update_progress

		# NOTE: unsure of where to put this, may belong in validator
		# FIXME -- validate that this directory actually exists and is correctly formatted
		directory = 'scripts/' + school
		if not config:
			config = '{0}/config.json'.format(directory)
		if not output_filepath:
			output_filepath = '{0}/data/courses2.json'.format(directory)
		if not output_error_filepath:
			output_error_filepath = '{0}/logs/error2.log'.format(directory)
 
		self.validator = Validator(config=config)

		# Dictionary that holds info before being committed as json object
		self.mouth = {'':''}

		# Initialize loggers for json and errors
		self.logger = JsonListLogger(logfile=output_filepath, errorfile=output_error_filepath)
		# TODO - needs to default write to logs in school directory
		self.logger.open() # writes '[' at top of file

		# initialize counters
		self.counter = Ingestor.initialize_counter()

	def __setitem__(self, key, value):
		self.mouth[key] = value
		return self

	def __getitem__(self, key):
		return self.mouth[key]

	def __delitem__(self, key):
		del self.mouth[key]

	def __contains__(self, key):
		return key in self.mouth

	def __iter__(self):
		for key in self.mouth:
			yield key

	def __len__(self):
		return len(self.mouth)

	def __str__(self):
		l = ''
		for label, value in self.mouth.items():
			l += smart_str(label) + ':' + smart_str(value) + '\n'
		return l

	def get(self, key, default=None):
		return self.mouth.get(key, default)

	def update(self, other=None, **kwargs):
		if other is not None:
			for k, v in other.items(): 
				self[k] = v
		for k, v in kwargs.items():
			self[k] = v

	def clear(self):
		self.mouth.clear()
		self.school = ''

	def getchain(self, *keys):
		'''Match the first key found in self.mouth dictionary.'''
		for key in keys:
			if key in self.mouth:
				return self.mouth[key]
		return None

	def get_counters(self):
		return self.counters

	def ingest_course(self):
		''' Create course json from info in model map.

		Returns:
			json object model for a course
		'''

		# support nested and non-nested department ingestion
		if 'department' in self.mouth or 'dept' in self.mouth:
			if not isinstance(self.getchain('department', 'dept'), dict):
				self.mouth['department'] = {
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
			'department': self.get('department'),
			'credits': self.getchain('credits', 'num_credits'),
			'prerequisites': make_list(self.getchain('prerequisites', 'prereqs')),
			'corequisites': make_list(self.getchain('corequisites', 'coreqs')),
			'exclusions': make_list(self.get('exclusions')),
			'description': make_list(self.getchain('description', 'descr')),
			'areas': self.get('areas'),
			'level': self.get('level'),
			'cores': make_list(self.get('cores')),
			'geneds': make_list(self.get('geneds')),
			'sections': self.get('sections'),
			'homepage': self.getchain('homepage', 'website'),
		}
		course = cleandict(course)
		if self.validate:
			is_valid = self.run_validator(lambda x: self.validator.validate(x), course)
			if is_valid:
				self.counter['courses']['valid'] += 1
		self.counter['courses']['total'] += 1
		self.logger.log(course)
		self.update_progress(mode='ingesting', **self.counter)
		return course

	def ingest_section(self, course):
		''' Create section json object from info in model map. 

		Args:
			course: course info mapping

		Returns:
			json object model for a section
		'''

		# handle nested instructor definition and resolution
		for key in [k for k in ['instructors', 'instrs', 'instructor', 'instr'] if k in self.mouth]:
			self.mouth[key] = make_list(self.mouth[key])
			instructors = self.mouth[key]
			for i in range(len(instructors)):
				if isinstance(instructors[i], basestring):
					instructors[i] = { 'name': instructors[i] }
			self.mouth['instructors'] = instructors
			break

		section = {
			'kind': 'section',
			'course': {
				'code': course['code']
			},
			'code': self.getchain('section_code', 'section', 'meeting_section'), # NOTE: design conflict with code in course
			'term': self.getchain('term', 'semester'),
			'year': self.get('year'), # NOTE: should be required
			'instructors': self.get('instructors'),
			'capacity': self.getchain('capacity', 'size'),
			'enrollment': self.getchain('enrollment', 'enrolment'), # NOTE: change to enrollment
			'waitlist': self.get('waitlist'),
			'waitlist_size': self.get('waitlist_size'),
			'remaining_seats': self.get('remaining_seats'),
			'type': self.getchain('type', 'section_type'),
			'fees': self.getchain('fees', 'fee'),
			'final_exam': self.get('final_exam'),
			'meetings': self.get('offerings')
		}

		section = cleandict(section)
		if self.validate:
			is_valid = self.run_validator(lambda x: self.validator.validate(x), section)
			if is_valid:
				self.counter['sections']['valid'] += 1
		self.counter['sections']['total'] += 1
		self.logger.log(section)
		self.update_progress(mode='ingesting', **self.counter)
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
		if 'time' not in self.mouth:
			self.mouth['time'] = {
				'start': self.getchain('time_start', 'start_time'),
				'end': self.getchain('time_end', 'end_time')
			}

		# handle nested location definition
		if isinstance(self.getchain('location', 'loc'), basestring):
			self.mouth['location'] = { 'where': self.getchain('location', 'loc') }

		meeting = {
			'kind': 'meeting',
			'course': section['course'],
			'section': {
				'code': section['code']
			},
			'days': make_list(self.getchain('days', 'day')),
			'dates': make_list(self.getchain('dates', 'date')),
			'time': self.mouth['time'],
			'location': self.get('location')
		}

		meeting = cleandict(meeting)
		if self.validate:
			is_valid = self.run_validator(lambda x: self.validator.validate(x), meeting)
			if is_valid:
				self.counter['meetings']['valid'] += 1
		self.counter['meetings']['total'] += 1
		self.logger.log(meeting)
		self.update_progress(mode='ingesting', **self.counter)
		return meeting

	def run_validator(self, validate_function, data):
		is_valid = False
		try:
			validate_function(data)
			is_valid = True
		except jsonschema.exceptions.ValidationError as e:
			# Wrap error in another (self-developed) error
			e = JsonValidationError(str(e), data)
			self.logger.log(e)
			if self.break_on_error:
				raise e
		except JsonValidationError as e:
			self.logger.log(e)
			if self.break_on_error:
				raise e
		except JsonValidationWarning as e:
			self.logger.log(e)
			if self.break_on_warning:
				raise e

		return is_valid

	# TODO - close json list properly on KeyBoardInterrupt
	def wrap_up(self):
		self.logger.close()
		self.mouth.clear()

	@staticmethod
	def initialize_counter():
		return {
			'courses': {
				'valid': 0,
				'total': 0
			},
			'sections': {
				'valid': 0,
				'total': 0
			},
			'meetings': {
				'valid': 0,
				'total': 0
			},
			'textbooks': {
				'valid': 0,
				'total': 0
			},
			'evaluations': {
				'valid': 0,
				'total': 0
			},
			'_format': {
				'function': lambda counter: '%s/%s' % (counter['valid'], counter['total']),
				'label': 'valid/total'
			}
		}
