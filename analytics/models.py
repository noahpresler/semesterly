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
    A timetable that is generated everytime a user makes a change to a timetable.
    Used to record the number of changes all uesrs made to their timetables, even
    when they are not saved.
    """
    courses = models.ManyToManyField(Course)
    semester = models.CharField(max_length=2)
    school = models.CharField(max_length=50)
    has_conflict = models.BooleanField(blank=True, default=False)
    time_created = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student, null=True, default=None)

class AnalyticsCourseSearch(models.Model):
    """
    A search that is saved everytime a user searches for a course. All courses DISPLAYED 
    are linked. 
    """
    query = models.CharField(max_length=200)
    courses = models.ManyToManyField(Course)
    is_advanced = models.BooleanField(blank=True, default=False)
    semester = models.CharField(max_length=2)
    school = models.CharField(max_length=50)
    student = models.ForeignKey(Student, null=True, default=None)

    # TODO: fill in for advanced search later.
    # areas = models.CharField(max_length=300, default='', null=True)
    # department = models.CharField(max_length=250, default='', null=True)
    # level = models.CharField(max_length=30, default='', null=True)

class DeviceCookie(models.Model):
    """
    A cookie which is dropped on each device tracking last login. 
    Provides analytics on the number of users we have logged in and logged out.
    """
    student = models.ForeignKey(Student, null=True, default=None)
    last_online = models.DateTimeField(auto_now_add=True)

class CalendarExport(models.Model):
    """
    Logs save calendar export events: save to ics or to google calendar
    """
    student = models.ForeignKey(Student, null=True, default=None)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=50)
    is_google_calendar = models.BooleanField(blank=True, default=False)

class FinalExamModalView(models.Model):
    """
    Logs that a final exam schedule has been viewed
    """
    student = models.ForeignKey(Student, null=True, default=None)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=50)

