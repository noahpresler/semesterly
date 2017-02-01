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
		directory=None, 
		validate=True,
		json_output_file=None,
		error_output_file=None,
		break_on_error=True, 
		break_on_warning=False,
		update_progress=lambda **kwargs: None):

		self.school = school
		self.validate = validate
		self.break_on_error = break_on_error
		self.break_on_warning = break_on_warning
		self.update_progress = update_progress

		self.map = {'':''}

		self.validator = Validator(directory=directory)
		self.error_logger = Logger(errorfile=error_output_file)
		self.json_logger = JsonListLogger(logfile=json_output_file)
		self.json_logger.open() # writes '[' at top of file

		# initialize counters
		count = {
			'valid': 0,
			'total': 0
		}
		self.counter = {
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
			'evaluations': count,
			'_format': {
				'function': lambda counter: '%s/%s' % (counter['valid'], counter['total']),
				'label': 'valid/total'
			}
		}

	def update_options(self, **kwargs):
		if 'hide_progress_bar' in kwargs and kwargs['hide_progress_bar']:
			self.update_progress = lambda **kwargs: None # set to noop
		if 'validate' in kwargs:
			self.validate = kwargs['validate']
		if 'break_on_errors' in kwargs:
			self.break_on_error = kwargs['break_on_errors']
		if 'break_on_warnings' in kwargs:
			self.break_on_warning = kwargs['break_on_warnings']

	def __setitem__(self, key, value):
		self.map[key] = value
		return self

	def __getitem__(self, key):
		return self.map[key]

	def __delitem__(self, key):
		del self.map[key]

	def __contains__(self, key):
		return key in self.map

	def __iter__(self):
		for key in self.map:
			yield key

	def __len__(self):
		return len(self.map)

	def __str__(self):
		l = ''
		for label, value in self.map.items():
			l += smart_str(label) + ':' + smart_str(value) + '\n'
		return l

	def get(self, key, default=None):
		return self.map.get(key, default)

	def update(self, other=None, **kwargs):
		if other is not None:
			for k, v in other.items(): 
				self[k] = v
		for k, v in kwargs.items():
			self[k] = v

	def clear(self):
		self.map.clear()
		self.school = ''

	def getchain(self, *keys):
		'''Match the first key found in self.map dictionary.'''
		for key in keys:
			if key in self.map:
				return self.map[key]
		return None

	def get_counters(self):
		return self.counters

	def ingest_course(self):
		''' Create course json from info in model map.

		Returns:
			json object model for a course
		'''

		# support nested and non-nested department ingestion
		if 'department' in self.map or 'dept' in self.map:
			if not isinstance(self.getchain('department', 'dept'), dict):
				self.map['department'] = {
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
			is_valid = self.run_validator(lambda x: self.validator.validate_course(x), course)
			if is_valid:
				self.counter['courses']['valid'] += 1
		self.counter['courses']['total'] += 1
		self.json_logger.log(course)
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
		for key in [k for k in ['instructors', 'instrs', 'instructor', 'instr'] if k in self.map]:
			self.map[key] = make_list(self.map[key])
			instructors = self.map[key]
			for i in range(len(instructors)):
				if isinstance(instructors[i], basestring):
					instructors[i] = { 'name': instructors[i] }
			self.map['instructors'] = instructors
			break

		section = {
			'kind': 'section',
			'course': {
				'code': course['code']
			},
			'code': self.getchain('section_code', 'section'), # NOTE: design conflict with code in course
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
			is_valid = self.run_validator(lambda x: self.validator.validate_section(x), section)
			if is_valid:
				self.counter['sections']['valid'] += 1
		self.counter['sections']['total'] += 1
		self.json_logger.log(section)
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
		if 'time' not in self.map:
			self.map['time'] = {
				'start': self.getchain('time_start', 'start_time'),
				'end': self.getchain('time_end', 'end_time')
			}

		# handle nested location definition
		if isinstance(self.getchain('location', 'loc'), basestring):
			self.map['location'] = { 'where': self.getchain('location', 'loc') }

		meeting = {
			'kind': 'meeting',
			'course': section['course'],
			'section': {
				'code': section['code']
			},
			'days': make_list(self.getchain('days', 'day')),
			'dates': make_list(self.getchain('dates', 'date')),
			'time': self.map['time'],
			'location': self.get('location')
		}

		meeting = cleandict(meeting)
		if self.validate:
			is_valid = self.run_validator(lambda x: self.validator.validate_meeting(x), meeting)
			if is_valid:
				self.counter['meetings']['valid'] += 1
		self.counter['meetings']['total'] += 1
		self.json_logger.log(meeting)
		self.update_progress(mode='ingesting', **self.counter)
		return meeting

	def run_validator(self, validate_function, data):
		is_valid = False
		try:
			validate_function(data)
			is_valid = True
		except (jsonschema.exceptions.ValidationError, JsonValidationError) as e:
			self.error_logger.log(e)
			if self.break_on_error:
				raise e
		except JsonValidationWarning as e:
			self.error_logger.log(e)
			if self.break_on_warning:
				raise e

		return is_valid

	# TODO - close json list properly on KeyBoardInterrupt
	def wrap_up(self):
		self.json_logger.close()
		self.map.clear()
