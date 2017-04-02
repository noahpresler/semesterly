""" Models pertaining to Students. """

from django.db import models
from django.contrib.auth.models import User
from timetable import models as timetable_models


class CalendarPreference(models.Model):
    calendar = models.ForeignKey('dtm.GoogleCalendar')
    visible = models.NullBooleanField(default=True)

class Student(models.Model):
    """ Database object representing a student.

        A student is the core user of the app. Thus, a student will have a
        class year, major, friends, etc. An object is only created for the
        user if they have signed up (that is, signed out users are not
        represented by Student objects).
    """
    FRESHMAN = 'FR'
    SOPHOMORE = 'SO'
    JUNIOR = 'JR'
    SENIOR = 'SR'
    class_year = models.IntegerField(blank=True, null=True)
    user = models.OneToOneField(User)
    img_url = models.CharField(max_length=300, default=-1)
    friends = models.ManyToManyField("self", blank=True)
    fbook_uid = models.CharField(max_length=255, default='')
    gender = models.CharField(max_length=255, default='')
    major = models.CharField(max_length=255, default='')
    social_courses = models.NullBooleanField(null=True)
    social_offerings = models.NullBooleanField(null=True)
    social_all = models.NullBooleanField(null=True)
    emails_enabled = models.NullBooleanField(null=True, default=True)
    integrations = models.ManyToManyField(timetable_models.Integration,
                                          blank=True)
    time_created = models.DateTimeField(auto_now_add=True)
    school = models.CharField(max_length=100, null=True)
    calendar_preferences = models.ManyToManyField(CalendarPreference, blank=True)


class Reaction(models.Model):
    """ Database object representing a reaction to a course.

        A Reaction is performed by a Student on a Course, and can be one of
        REACTION_CHOICES below. The reaction itself is represented by its
        `title` field.
    """
    REACTION_CHOICES = (
        ('FIRE', 'FIRE'),
        ('LOVE', 'LOVE'),
        ('CRAP', 'CRAP'),
        ('OKAY', 'OKAY'),
        ('BORING', 'BORING'),
        ('HARD', 'HARD'),
        ('EASY', 'EASY'),
        ('INTERESTING', 'INTERESTING'))
    student = models.ForeignKey('student.Student')
    course = models.ManyToManyField(timetable_models.Course)
    title = models.CharField(max_length=50, choices=REACTION_CHOICES)
    time_created = models.DateTimeField(auto_now_add=True)


class PersonalTimetable(models.Model):
    """ Database object representing a timetable created (and saved) by a user.

        A PersonalTimetable belongs to a Student, and contains a list of
        Courses and Sections that it represents.
    """
    courses = models.ManyToManyField(timetable_models.Course)
    school = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    _semester = models.CharField(max_length=2) # deprecated
    semester = models.ForeignKey('timetable.Semester')
    time_updated = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student)
    last_updated = models.DateTimeField(auto_now=True)
    sections = models.ManyToManyField(timetable_models.Section)
    has_conflict = models.BooleanField(blank=True, default=False)


class RegistrationToken(models.Model):
    """ Database object used during signup. """
    auth = models.TextField(default='')
    p256dh = models.TextField(default='')
    endpoint = models.TextField(default='')
    student = models.ForeignKey(Student, null=True, default=None)
