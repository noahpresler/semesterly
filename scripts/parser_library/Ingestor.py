# @what     Parsing library Ingestor
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/13/17

import simplejson as json
from pygments import highlight, lexers, formatters, filters

class Ingestor:

	# TODO - abstract dictionary methods into ABC
	def __init__(self, school):
		self.map = {}
		self.school = school
		self.file = open('/home/mike/Documents/semesterly/scripts/parser_library/ex_school/data/courses.json', 'w')
		self.file.write('[')

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

	def create_course(self):
		''' Create course json from info in model map.

		Returns:
			json object model for a course
		'''

		course = {
			'kind': 'course',
			'school': {
				'code': self.school
			},
			'code': self.map['code'],
			'name': self.map['name'],
			'department': {
				'name': clean_empty(self.map.get('dept_name')),
				'code': clean_empty(self.map.get('dept_code'))
			},
			'credits': self.map['credits'],
			'prerequisites': make_list(self.map.get('prereqs')),
			'corequisites': make_list(self.map.get('coreqs')),
			'exclusions': make_list(self.map.get('exclusions')),
			'description': make_list(self.map.get('descr', '')),
			'areas': make_list(self.map.get('areas')),
			'level': clean_empty(self.map.get('level')),
			'cores': make_list(self.map.get('cores')),
			'geneds': make_list(self.map.get('geneds')),
			'sections': make_list(self.map.get('sections')),
			'homepage': clean_empty(self.map.get('homepage')),
		}
		course = Ingestor.cleandict(course)
		j = json.dumps(course, sort_keys=True, indent=4, separators=(',', ': '))
		print Ingestor.color_json(j)
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
		section = {
			'kind': 'section',
			'course': {
				'code': course['code']
			},
			'code': self.map['section'],
			'term': self.map['term'],
			'year': self.map.get('year'), # NOTE: should be required
			'instructors': [ {'name': name} for name in make_list(self.map.get('instrs'))],
			'capacity': self.map.get('size'),
			'enrollment': self.map.get('enrolment'), #NOTE: change to enrollment
			'waitlist': self.map.get('waitlist'),
			'waitlist_size': self.map.get('waitlist_size'),
			'remaining_seats': self.map.get('remaining_seats'),
			'type': clean_empty(self.map.get('section_type')),
			'fees': clean_empty(self.map.get('fees')),
			'final_exam': clean_empty(self.map.get('final_exam')),
			'meetings': clean_empty(self.map.get('offerings'))
		}

		section = Ingestor.cleandict(section)
		j = json.dumps(section, sort_keys=True, indent=4, separators=(',', ': '))
		self.file.write(j)
		self.file.write(',')
		print Ingestor.color_json(j)
		return section

	def create_offerings(self, section_model):
		self.create_meeting(section_model)

	def create_meeting(self, section):
		''' Create meeting ingested json map.

		Args:
			section: section info mapping

		Returns:
			json object model for a meeting

		'''

		meeting = {
			'kind': 'meeting',
			'course': section['course'],
			'section': {
				'code': section['code']
			},
			'days': make_list(self.map.get('days')),
			'dates': make_list(self.map.get('dates')),
			'time': {
				'start': self.map['time_start'],
				'end': self.map['time_end']
			},
			'location': {
				'building': 'TODO',
				'where': self.map.get('location')
			}
		}

		meeting = Ingestor.cleandict(meeting)
		j = json.dumps(meeting, sort_keys=True, indent=4, separators=(',', ': '))
		self.file.write(j)
		self.file.write(',')
		print Ingestor.color_json(j)
		return meeting

	# TODO - close json list
	def wrap_up(self):
		self.map.clear()
		self.file.write(']')
		self.file.close()
		exit(1)

	@staticmethod
	def cleandict(d):
		if not isinstance(d, dict):
			return d
		return dict((k, Ingestor.cleandict(v)) for k,v in d.iteritems() if v is not None) # and len(filter(None, v)) > 0

	@staticmethod
	def DEBUG():
		pass # TODO

	# color json output of error message
	@staticmethod
	def color_json(j):
		l = lexers.JsonLexer()
		l.add_filter('whitespace')
		colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
		return colorful_json

def make_list(l, base_type=basestring):
	if isinstance(l, base_type):
		l = [l]
	return clean_empty(l)

def clean_empty(a):
	if not a: return None
	a = filter(None, a)
	if len(a) == 0:
		return None
	return a
