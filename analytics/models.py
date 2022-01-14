# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from timetable.models import *
from student.models import Student


class SharedTimetable(Timetable):
    """
    A timetable for which a user generated a share link.
    Not necessarily tied to a Student object, since logged out users
    can also generate links to share a timetable. But if a logged-in user
    does generate it, this information will be recorded.
    """
    has_conflict = models.BooleanField(blank=True, default=False)
    time_created = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)


class SharedTimetableView(models.Model):
    shared_timetable = models.ForeignKey(SharedTimetable, on_delete=models.deletion.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)


class SharedCourseView(models.Model):
    shared_course = models.ForeignKey(Course, on_delete=models.deletion.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)


class AnalyticsTimetable(models.Model):
    """
    A timetable that is generated everytime a user makes a change to a timetable.
    Used to record the number of changes all uesrs made to their timetables, even
    when they are not saved.
    """
    courses = models.ManyToManyField(Course)
    semester = models.ForeignKey('timetable.Semester', on_delete=models.deletion.CASCADE)
    school = models.CharField(max_length=50)
    has_conflict = models.BooleanField(blank=True, default=False)
    time_created = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)


class AnalyticsCourseSearch(models.Model):
    """
    A search that is saved everytime a user searches for a course. All courses DISPLAYED 
    are linked. 
    """
    query = models.CharField(max_length=200)
    courses = models.ManyToManyField(Course)
    is_advanced = models.BooleanField(blank=True, default=False)
    semester = models.ForeignKey('timetable.Semester', on_delete=models.deletion.CASCADE)
    school = models.CharField(max_length=50)
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)

    # TODO: fill in for advanced search later.
    # areas = models.CharField(max_length=300, default='', null=True)
    # department = models.CharField(max_length=255, default='', null=True)
    # level = models.CharField(max_length=30, default='', null=True)


class DeviceCookie(models.Model):
    """
    A cookie which is dropped on each device tracking last login. 
    Provides analytics on the number of users we have logged in and logged out.
    """
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)
    last_online = models.DateTimeField(auto_now_add=True)


class CalendarExport(models.Model):
    """
    Logs save calendar export events: save to ics or to google calendar
    """
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=50)
    is_google_calendar = models.BooleanField(blank=True, default=False)


class FinalExamModalView(models.Model):
    """
    Logs that a final exam schedule has been viewed
    """
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=50)


class FacebookAlertView(models.Model):
    """
    Logs that a continue with Facebook alert has been viewed
    """
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=50)


class FacebookAlertClick(models.Model):
    """
    Logs that a continue with Facebook alert has been viewed
    """
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=50)
