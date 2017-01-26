# @what     Parsing library Ingestor
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/13/17

import simplejson as json
from pygments import highlight, lexers, formatters, filters
from scripts.parser_library.Validator import Validator, JsonValidationError
from InternalUtils import *

class Ingestor:

	def __init__(self, school, directory='scripts/parser_library/ex_school/'):
		self.map = {}
		self.school = school
		self.file = open(directory + 'data/courses.json', 'w') # TODO - warn if overwriting file
		self.file.write('[')
		self.validator = Validator(directory=directory)
		self.map[''] = ''

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

	def create_course(self):
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
			'department': self.map.get('department'),
			'credits': self.getchain('credits', 'num_credits'),
			'prerequisites': make_list(self.getchain('prerequisites', 'prereqs')),
			'corequisites': make_list(self.getchain('corequisites', 'coreqs')),
			'exclusions': make_list(self.map.get('exclusions')),
			'description': make_list(self.getchain('description', 'descr')),
			'areas': self.map.get('areas'),
			'level': self.map.get('level'),
			'cores': make_list(self.map.get('cores')),
			'geneds': make_list(self.map.get('geneds')),
			'sections': self.map.get('sections'),
			'homepage': self.getchain('homepage', 'website'),
		}
		course = cleandict(course)
		j = json.dumps(course, sort_keys=True, indent=4, separators=(',', ': '))
		Ingestor.run_validator(lambda x: self.validator.validate_course(x), course)
		print pretty_json(j)
		self.file.write(j)
		self.file.write(',')
		return course

	def create_section(self, course):
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
			'year': self.map.get('year'), # NOTE: should be required
			'instructors': self.map.get('instructors'),
			'capacity': self.getchain('capacity', 'size'),
			'enrollment': self.getchain('enrollment', 'enrolment'), # NOTE: change to enrollment
			'waitlist': self.map.get('waitlist'),
			'waitlist_size': self.map.get('waitlist_size'),
			'remaining_seats': self.map.get('remaining_seats'),
			'type': self.getchain('type', 'section_type'),
			'fees': self.getchain('fees', 'fee'),
			'final_exam': self.map.get('final_exam'),
			'meetings': self.map.get('offerings')
		}

		section = cleandict(section)
		j = json.dumps(section, sort_keys=True, indent=4, separators=(',', ': '))
		Ingestor.run_validator(lambda x: self.validator.validate_section(x), section)
		self.file.write(j)
		self.file.write(',')
		print pretty_json(j)
		return section

	def create_offerings(self, section):
		self.create_meeting(section)
	def create_offering(self, section):
		self.create_meeting(section)

	def create_meeting(self, section):
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
			'location': self.map.get('location')
		}

		meeting = cleandict(meeting)
		j = json.dumps(meeting, sort_keys=True, indent=4, separators=(',', ': '))
		Ingestor.run_validator(lambda x: self.validator.validate_meeting(x), meeting)
		self.file.write(j)
		self.file.write(',')
		print pretty_json(j)
		return meeting

	# TODO - output to logger (should be integrated into validator itself) 
	@staticmethod
	def run_validator(validate, data):
		try:
			validate(data)
		except JsonValidationError as e:
			print e.message
			if e.json:
				print pretty_json(e.json)
			exit(1)

	# TODO - close json list properly
	def wrap_up(self):
		self.map.clear()
		self.file.write(']')
		self.file.close()
		exit(1)

	@staticmethod
	def DEBUG():
		pass # TODO