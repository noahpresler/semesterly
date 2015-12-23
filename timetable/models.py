import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'
from django.db import models

# Create your models here.
class Course(models.Model):
	code = models.CharField(max_length=20)
	name = models.CharField(max_length=250)
	description = models.TextField(max_length=1500)
	campus = models.IntegerField()
	breadths = models.CharField(max_length=5, default='')
	prerequisites = models.TextField(max_length=1000, default='')
	exclusions = models.TextField(max_length=1000, default='')
	
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

	def __unicode__(self):
		# return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
		return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)


class HopkinsCourse(models.Model):
	code = models.CharField(max_length=25)
	name = models.CharField(max_length=250)
	description = models.TextField(max_length=1500)
	campus = models.IntegerField()
	breadths = models.CharField(max_length=5, default='')
	prerequisites = models.TextField(max_length=1000, default='')
	exclusions = models.TextField(max_length=1000, default='')
	
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

class HopkinsCourseOffering(models.Model):
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


	def __unicode__(self):
		# return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
		return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)

