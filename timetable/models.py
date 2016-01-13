import os
import re
os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'
from django.db import models
from django.forms.models import model_to_dict

# Create your models here.
class Course(models.Model):
	code = models.CharField(max_length=20)
	name = models.CharField(max_length=250)
	description = models.TextField(max_length=1500)
	unstopped_description = models.TextField(max_length=1500)
	campus = models.IntegerField()
	breadths = models.CharField(max_length=5, default='')
	prerequisites = models.TextField(max_length=1000, default='')
	exclusions = models.TextField(max_length=1000, default='')
	related_courses = models.ManyToManyField("self", blank=True)
	
	def __unicode__(self):
		return self.code + ": " + self.name

	def get_code(self):
		return self.code

	def get_name(self):
		return self.name

	def get_description(self):
		return self.description

	def get_breadths(self):
		return map(int, sorted(self.breadths))

	def get_prereqs(self):
		return self.prerequisites

	def get_dept(self):
		return self.code[:3]

	def get_all_textbook_info(self):
		# Implement
		textbook_info = []
		for co in CourseOffering.objects.filter(course=self):
			tb = {
			"section" : co.meeting_section,
			"textbooks" : co.get_textbooks()
			}
			textbook_info.append(tb)
		return textbook_info

	def get_related_course_info(self):
		info = []
		related = self.related_courses.all()
		for c in related:
			info.append(model_to_dict(c))
		return info

	def get_eval_info(self):
		# implement
		return []

	def get_exclusions(self):
		return self.exclusions

class Textbook(models.Model):
	isbn = models.CharField(max_length=13)
	is_required = models.BooleanField(default=False)
	detail_url = models.URLField(max_length=1000)
	image_url = models.URLField(max_length=1000)
	author = models.CharField(max_length=500)
	title = models.CharField(max_length=1500)

class CourseOffering(models.Model):
	course = models.ForeignKey(Course)
	semester = models.CharField(max_length=2)
	meeting_section = models.CharField(max_length=20)
	instructors = models.CharField(max_length=100)
	day = models.CharField(max_length=1)
	time_start = models.CharField(max_length=15)
	time_end = models.CharField(max_length=15)
	location = models.CharField(max_length=200)
	size = models.IntegerField(default=0)
	enrolment = models.IntegerField(default=0)
	alternates = models.BooleanField(default=False)
	section_type = models.CharField(max_length=5)
	can_be_locked = models.BooleanField(default=False)
	textbooks = models.ManyToManyField(Textbook)

	def __unicode__(self):
		# return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
		return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)
	
	def get_textbooks(self):
		textbooks = []
		temp = []
		tbs = self.textbooks.all()
		for tb in tbs:
			textbooks.append(tb.get_info())
		return textbooks

class HopkinsCourse(models.Model):
	code = models.CharField(max_length=25)
	name = models.CharField(max_length=250)
	description = models.TextField(max_length=1500)
	unstopped_description = models.TextField(max_length=1500)
	campus = models.IntegerField()
	breadths = models.CharField(max_length=5, default='')
	prerequisites = models.TextField(max_length=1000, default='')
	exclusions = models.TextField(max_length=1000, default='')
	related_courses = models.ManyToManyField("self", blank=True)
	
	def __unicode__(self):
		return self.code + ": " + self.name

	def get_code(self):
		return self.code

	def get_name(self):
		return self.name

	def get_description(self):
		return self.description

	def get_breadths(self):
		return map(int, sorted(self.breadths))

	def get_prereqs(self):
		return self.prerequisites

	def get_exclusions(self):
		return self.exclusions
		
	def get_dept_matches(self):
		code_pattern = re.compile(r"(.*\..*)\.(.*)")
		department = re.search(code_pattern,self.get_code()).group(1)
		return HopkinsCourse.objects.filter(code__contains=department)

	def get_all_textbook_info(self):
		textbook_info = []
		for co in HopkinsCourseOffering.objects.filter(course=self):
			tb = {
			"section" : co.meeting_section,
			"textbooks" : co.get_textbooks()
			}
			textbook_info.append(tb)
		final = []
		for i in textbook_info:
			if not any(d['section'] == i['section'] for d in final):
				final.append(i)
		return final

	def get_eval_info(self):
		eval_info = []
		evals = HopkinsCourseEvaluation.objects.filter(course=self)
		for e in evals:
			eval_info.append(model_to_dict(e))
		final = []
		for i in eval_info:
			if not any(d['year'] == i['year'] for d in final):
				final.append(i)
		return sorted(final, key=lambda k: k['year']) 

	def get_related_course_info(self):
		info = []
		related = self.related_courses.all()
		for c in related:
			info.append(model_to_dict(c))
		return info


class HopkinsCourseEvaluation(models.Model):
	score = models.FloatField(default=5.0)
	summary = models.TextField(max_length=1500)
	professor = models.CharField(max_length=250)
	course_code = models.CharField(max_length=20)
	course = models.ForeignKey(HopkinsCourse)
	year = models.CharField(max_length=200)

class HopkinsTextbook(models.Model):
	isbn = models.CharField(max_length=13)
	is_required = models.BooleanField(default=False)
	detail_url = models.URLField(max_length=1000)
	image_url = models.URLField(max_length=1000)
	author = models.CharField(max_length=500)
	title = models.CharField(max_length=1500)

	def __unicode__(self):
		return "ISBN:" + self.isbn + " - Required:" + str(self.is_required)

	def get_isbn(self):
		return self.isbn

	def get_is_required(self):
		return self.is_required

	def get_info(self):
		return model_to_dict(self)

class HopkinsCourseOffering(models.Model):
	textbooks = models.ManyToManyField(HopkinsTextbook)
	course = models.ForeignKey(HopkinsCourse)
	semester = models.CharField(max_length=2)
	meeting_section = models.CharField(max_length=25)
	instructors = models.CharField(max_length=100)
	day = models.CharField(max_length=1)
	time_start = models.CharField(max_length=15)
	time_end = models.CharField(max_length=15)
	location = models.CharField(max_length=250)
	size = models.IntegerField(default=0)
	enrolment = models.IntegerField(default=0)
	alternates = models.BooleanField(default=False)
	evaluation_score = models.FloatField(default=0)
	# all courseofferings are the same type, we pick an aribtrary name
	section_type = models.CharField(max_length=5, default='C')
	can_be_locked = models.BooleanField(default=True)

	def get_course_code(self):
		return self.course.code + self.meeting_section

	def get_course_tag(self):
		return '<course dept="' + self.get_dept().strip() + '" num="' + self.get_course().strip() + '" sect="' + self.get_section().strip() + '" term="W16"/>'

	def get_dept(self):
		code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
		matches = re.search(code_pattern,self.get_course_code())
		return str(matches.group(1))

	def get_course(self):
		code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
		matches = re.search(code_pattern,self.get_course_code())
		return str(matches.group(2))

	def get_section(self):
		code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
		matches = re.search(code_pattern,self.get_course_code())
		return str(matches.group(3))

	def __unicode__(self):
		# return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
		return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)

	def get_textbooks(self):
		textbooks = []
		temp = []
		tbs = self.textbooks.all()
		for tb in tbs:
			textbooks.append(tb.get_info())
		return textbooks
