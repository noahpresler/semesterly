from django.db import models

from timetable.models import *

class Session(models.Model):
	session_id = models.CharField(max_length=30, default=-1)
	ip = models.CharField(max_length=20)
	time = models.DateTimeField(auto_now_add=True) # automatically saves current time when object is created
	lat_long = models.CharField(max_length=30)
	city = models.CharField(max_length=30)
	country = models.CharField(max_length=20)
	end_time = models.DateTimeField(blank=True,null=True)



# UOFT

class SearchQuery(models.Model):
	session = models.ForeignKey(Session)
	time = models.DateTimeField(auto_now_add=True) # automatically saves current time when object is created
	query = models.CharField(max_length=20)
	cur_semester = models.CharField(max_length=2)
	cur_campuses = models.CharField(max_length=10)

class Timetable(models.Model):
	session = models.ForeignKey(Session)
	time = models.DateTimeField(auto_now_add=True) # automatically saves current time when object is created
	courses = models.ManyToManyField(Course)
	is_conflict = models.NullBooleanField(blank=True, null=True)

# HOPKINS

class HopkinsSearchQuery(models.Model):
	session = models.ForeignKey(Session)
	time = models.DateTimeField(auto_now_add=True) # automatically saves current time when object is created
	query = models.CharField(max_length=20)
	cur_semester = models.CharField(max_length=2)
	cur_campuses = models.CharField(max_length=10)

class HopkinsTimetable(models.Model):
	session = models.ForeignKey(Session)
	time = models.DateTimeField(auto_now_add=True) # automatically saves current time when object is created
	courses = models.ManyToManyField(HopkinsCourse)
	is_conflict = models.NullBooleanField(blank=True, null=True)

	