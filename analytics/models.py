from django.db import models
from timetable.models import *
from student.models import Student

class SharedTimetable(models.Model):
	"""
	A timetable for which a user generated a share link.
	Not necessarily tied to a Student object, since logged out users
	can also generate links to share a timetable. But if a logged-in user
	does generate it, this information will be recorded.
	"""
	courses = models.ManyToManyField(Course)
	sections = models.ManyToManyField(Section)
	semester = models.CharField(max_length=2)
	school = models.CharField(max_length=50)
	name = models.CharField(max_length=100, null=True)
	has_conflict = models.BooleanField(blank=True, default=False)
	time_created = models.DateTimeField(auto_now_add=True)
	student = models.ForeignKey(Student, null=True, default=None)

class AnalyticsTimetable(models.Model):
	"""
	TODO(Eric): describe this model lol
	"""
	courses = models.ManyToManyField(Course)
	semester = models.CharField(max_length=2)
	school = models.CharField(max_length=50)
	has_conflict = models.BooleanField(blank=True, default=False)
	time_created = models.DateTimeField(auto_now_add=True)
	student = models.ForeignKey(Student, null=True, default=None)
