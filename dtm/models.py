from __future__ import unicode_literals
from timetable.models import *
from student.models import *
from django.db import models
import datetime

class GoogleCalendar(models.Model):
   	student = models.ForeignKey(Student, null=True, default=None)
	calendar_id = models.CharField(max_length=1024)
	name = models.CharField(max_length=1024)

class AvailabilityShare(models.Model):
	student = models.ForeignKey('student.Student')
	time_created = models.DateTimeField(auto_now_add=True)
	start_day = models.DateTimeField(auto_now_add=False, default=None)
	expiry = models.DateTimeField(auto_now_add=False, default=None, null=True)
	google_calendars = models.ManyToManyField(GoogleCalendar, blank=True)
	duration = models.DurationField(null=True, default=datetime.timedelta(minutes=30))