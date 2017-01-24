# @what     Parsing library Digestor Adapter
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/22/17

import django, datetime, os, copy
from django.utils.encoding import smart_str, smart_unicode
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
import jsondiff, simplejson as json
from pygments import highlight, lexers, formatters, filters

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

class Digestor:

	def __init__(self, school, data_file):
		self.school = school
		with open(data_file, 'r') as f:
			self.data = json.load(f)
		self.data = [ dotdict(obj) for obj in self.data ]

		# Cache last created course and section
		self.cached_course = dotdict({'code': '_'})
		self.cached_section = dotdict({'code': '_'})

	def digest(self, diff=True):

		self.operate = None
		if diff:
			exclude = lambda d: {x: d[x] for x in d if x != 'defaults'}
			self.operate = {
				'course': lambda kwargs: Digestor.diff(kwargs, Course.objects.filter(**exclude(kwargs)).first()),
				'section': lambda kwargs: Digestor.diff(kwargs, Section.objects.filter(**exclude(kwargs)).first()),
				'offering': lambda kwargs: Digestor.diff(kwargs, Offering.objects.filter(**exclude(kwargs)).first())
			}
		else:
			self.operate = {
				'course': lambda kwargs: Course.objects.update_or_create(**kwargs),
				'section': lambda kwargs: Section.objects.update_or_create(**kwargs),
				'offering': lambda kwargs: Offering.objects.update_or_create(**kwargs)
			}
		self.operate = dotdict(self.operate)

		for obj in self.data:
			# try:
			res = {
				'course': lambda x: self.create_course(x),
				'section': lambda x: self.create_section(x, clean=not diff),
				'meeting': lambda x: self.create_offerings(x),
				'instructor': lambda x: self.create_instructor(x),
				'final_exam': lambda x: self.create_final_exam(x),
				'textbook': lambda x: self.create_textbook(x),
				'textbook_link': lambda x: self.create_textbook_link(x)
			}[obj.kind](obj)

			# save
			if not diff:
				if isinstance(res, list):
					for r in res:
						r.save()
				else:
					res.save()


			print res
			print '-------------'

			# print 'Digested', obj
			# except django.core.exceptions.DataError as error:
			# 	print 'ERROR'
			# 	print obj
			# 	print error
		self.wrap_up()

	@staticmethod
	def pretty_json(j):
		if isinstance(j, dict):
			j = json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
		l = lexers.JsonLexer()
		l.add_filter('whitespace')
		colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
		return colorful_json

	@staticmethod
	def diff(a, b):
		name = ''
		add = {}
		if a is None or b is None:
			return None, False
		c = copy.deepcopy(b.__dict__)
		for d in [a, c]:
			if 'defaults' in d:
				defaults = d['defaults']
				del d['defaults']
				d.update(defaults)
			blacklist = {'_state', 'id', 'course', 'section', 'section_id', 'course_id'}
			for k in d.keys():
				if k in blacklist:
					del d[k]
		diffed = jsondiff.diff(c, a, syntax='symmetric', dump=True)
		print Digestor.pretty_json(json.loads(diffed))
		return b, True

	def create_instructor(self, instructor):
		pass # TODO
	def create_final_exam(self, final_exam):
		pass # TODO
	def create_textbook(self, textbook):
		pass # TODO
	def create_textbook_link(self, textbook_link):
		pass # TODO

	def create_course(self, course):
		''' Create course in database from info in json model.

		Returns:
			django course model object
		'''
		adapted = {}
		adapted['name'] = course.get('name', '')
		if 'credits' in course:
			adapted['num_credits'] = course.credits
		if 'description' in course:
			adapted['description'] = '\n'.join(course.description)
		if 'department' in course:
			if 'code' in course.department:
				adapted['department'] = course.department.code
			if 'name' in course.department:
				adapted['department'] = course.department.name # TODO - add field for code+name in django
		if 'prerequisites' in course:
			adapted['prerequisites'] = ', '.join(course.prerequisites)
		if 'corequisites' in course:
			adapted['corequisites'] = ', '.join(course.corequisites)
		if 'exclusions' in course:
			adapted['exclusions'] = ', '.join(course.exclusions)
		if 'areas' in course:
			adapted['areas'] = ', '.join(course.areas)
		if 'cores' in course:
			adapted['cores'] = ', '.join(course.cores)
		if 'geneds' in course:
			adapted['geneds'] = ', '.join(course.geneds)
		if 'level' in course:
			adapated['level'] = course.level

		course_model, created = self.operate.course({
			'code': course.code,
			'school': self.school,
			'defaults': adapted
		})

		if course_model:
			self.cached_course = course_model
			for section in course.get('sections', []):
				self.create_section(section, course_model)

		return course_model

	def create_section(self, section, course_model=None, clean=True):
		''' Create section in database from info in model map. 
		
		Args:
			course_model: django course model object

		Keyword args:
			clean (boolean): removes course offerings associated with section if set

		Returns:
			django section model object
		'''
		if course_model is None:
			if section.course.code == self.cached_course.code:
				course_model = self.cached_course
			else:
				course_model = Course.objects.filter(school=self.school, code=section.course.code).first()
				if course_model is None:
					return # TODO - raise Error

		adapted = {}
		if 'capacity' in section:
			adapted['size'] = section.capacity
		if 'enrollment' in section:
			# TODO - change 'enrolment' to 'enrollment' in django model
			adapted['enrolment'] = section.enrollment
		if 'waitlist' in section:
			adapted['waitlist'] = section.waitlist
		if 'waitlist_size' in section:
			adapted['waitlist_size'] = section.waitlist_size
		if 'remaining_seats' in section:
			# FIXME -- possible logic conflict with other data
			adapted['remaining_seats'] = section.remaining_seats
		if 'type' in section:
			adapted['section_type'] = section.type[0]
		if 'fees' in section:
			pass # TODO - add fees to database
		if 'instructors' in section:
			# FIXME -- might break with instructor as object
			if isinstance(section.instructor, str):
				adapted['instructors'] = ', '.join(section.instructors)
			else:
				adapted['instructors'] = ', '.join(i['name'] for i in section.instructors)
		if 'final_exam' in section:
			pass # TODO - add to database

		section_model, created = self.operate.section({
			'course': course_model,
			'semester': 'S', #section.term[0], # TODO - add year to django model
			'meeting_section': section.code,
			'defaults': adapted
		})

		if section_model:
			self.cached_course = course_model
			self.cached_section = section_model
			for meeting in section.get('meetings', []):
				self.create_offerings(meeting, section_model)

			if clean:
				Digestor.remove_offerings(section_model)

		return section_model

	def create_offerings(self, meeting, section_model=None):
		''' Create offering in database from info in model map.

		Args:
			course_model: django course model object
		'''

		if section_model is None:
			course_model = None
			if meeting.course.code == self.cached_course.code:
				course_model = self.cached_course
			else:
				course_model = Course.objects.filter(school=self.school, code=meeting.course.code).first()
				if course_model is None:
					return # TODO - raise Error
			if course_model.code == self.cached_course.code and meeting.section.code == self.cached_section.meeting_section:
					section_model = self.cached_section
			else:
				section_model = Section.objects.filter(course=course_model, meeting_section=meeting.section.code).first()
				if section_model is None:
					return # TODO - raise Error
				self.cached_course = course_model
				self.cached_section = section_model

		# NOTE: ignoring dates for now
		offering_models = []
		for day in meeting.get('days', []):
			offering_model, created = self.operate.offering({
				'section': section_model,
				'day': day,
				'time_start': meeting.time.start,
				'time_end': meeting.time.end,
				'defaults': {
					'location': meeting.location.get('where', '')
				}
			})
			offering_models.append(offering_model)

		return offering_models


	def remove_section(self, course_model):
		''' Remove section specified in model map from django database. '''
		if Section.objects.filter(course = course_model, meeting_section = self.map.get('section')).exists():
			s = Section.objects.get(course = course_model, meeting_section = self.map.get('section'))
			s.delete()

	@staticmethod
	def remove_offerings(section_model):
		''' Remove all offerings associated with a section. '''
		Offering.objects.filter(section=section_model).delete()

	def wrap_up(self):
		''' Update time updated for school at end of parse. '''
		update_object, created = Updates.objects.update_or_create(
				school=self.school,
				update_field="Course",
				defaults={'last_updated': datetime.datetime.now()}
		)
		update_object.save()

def main():
	d = Digestor('chapman', '/home/mike/Documents/semesterly/scripts/parser_library/ex_school/data/courses.json')
	d.digest()

if __name__ == '__main__':
	main()