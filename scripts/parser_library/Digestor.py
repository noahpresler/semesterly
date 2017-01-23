# @what     Parsing library Digestor Adapter
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/22/17

import django, datetime, os
from django.utils.encoding import smart_str, smart_unicode
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
import simplejson as json

class dotdict(dict):
	"""dot.notation access to dictionary attributes"""
	__getattr__ = dict.get
	__setattr__ = dict.__setitem__
	__delattr__ = dict.__delitem__

class Digestor:

	def __init__(self, school, data_file):
		self.school = school
		with open(data_file, 'r') as f:
			self.data = json.load(f)
		self.data = [ dotdict(obj) for obj in self.data ]

		# Cache last created course and section
		self.cached_course = None
		self.cached_section = None

	def digest(self):
		for obj in self.data:
			{
				'course': lambda x: self.create_course(x),
				'section': lambda x: self.create_section(x),
				'meeting': lambda x: self.create_offerings(x),
				'instructor': lambda x: self.create_instructor(x),
				'final_exam': lambda x: self.create_final_exam(x),
				'textbook': lambda x: self.create_textbook(x),
				'textbook_link': lambda x: self.create_textbook_link(x)
			}[obj.kind](obj)

	def create_course(self, course):
		''' Create course in database from info in json model.

		Returns:
			django course model object
		'''
		adapted = {}
		if 'name' in course:
			adapted['name'] = course.name
		if 'description' in course:
			adapted['description'] = '\n'.join(course.description)
		if 'department' in course:
			if 'code' in course.department:
				adapted['department'] = course.department.code
			if 'name' in course.department:
				adapted['department'] = course.department.name
		if 'prerequisites' in course:
			adapted['prerequisites'] = ';'.join(course.prerequisites)
		if 'corequisites' in course:
			adapted['corequisites'] = ';'.join(course.corequisites)
		if 'exclusions' in course:
			adapted['exclusions'] = ';'.join(course.exclusions)

		course_model, created = Course.objects.update_or_create(
			code = course.code,
			school = self.school,
			defaults={ **adapted }
		)

		if created:
			self.cached_course = course_model

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
				course_model = Course.objects.get(code=section.course.code)

		section_model, section_was_created = Section.objects.update_or_create(
			course=course_model,
			semester=self.section.term,
			meeting_section = self.section.code,
			defaults = {
				'instructors': self.course.get('instrs'),
				'size': self.course.get('size'),
				'enrolment': self.course.get('enrolment'),
				'waitlist': self.course.get('waitlist', -1),
				'section_type': self.course.get('section_type', 'X')
			}
		)

		if clean:
			Model.remove_offerings(section)

		return section

	def create_offerings(self, section_model):
		''' Create offering in database from info in model map.

		Args:
			course_model: django course model object
		'''
		if self.map.get('days'):
			for day in self.map.get('days'):
				offering_model, offering_was_created = Offering.objects.update_or_create(
					section = section_model,
					day = day,
					time_start = self.map.get('time_start'),
					time_end = self.map.get('time_end'),
					defaults = {
						'location': self.map.get('location')
					}
				)

	def remove_section(self, course_model):
		''' Remove section specified in model map from django database. '''
		if Section.objects.filter(course = course_model, meeting_section = self.map.get('section')).exists():
			s = Section.objects.get(course = course_model, meeting_section = self.map.get('section'))
			s.delete()

	@staticmethod
	def remove_offerings(section_model):
		''' Remove all offerings associated with a section. '''
		Offering.objects.filter(section = section_model).delete()

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