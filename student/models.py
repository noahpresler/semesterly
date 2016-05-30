from django.db import models
from django.contrib.auth.models import User
from timetable.models import *

class Student(models.Model):
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

class Reaction(models.Model):
  REACTION_CHOICES = (
    ('FIRE', 'FIRE'),
    ('LOVE', 'LOVE'),
    ('CRAP', 'CRAP'),
    ('OKAY', 'OKAY'),
    ('BORING', 'BORING'),
    ('HARD', 'HARD'),
    ('TEARS', 'TEARS'),
    ('INTERESTING', 'INTERESTING'),
  )
  student = models.ForeignKey('student.Student')
  course = models.ManyToManyField(Course)
  title = models.CharField(max_length=50, choices=REACTION_CHOICES)
  
class PersonalTimetable(models.Model):
    courses = models.ManyToManyField(Course)
    school = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    semester = models.CharField(max_length=2)
    time_updated = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student)
    last_updated = models.DateTimeField(auto_now=True)
    sections = models.ManyToManyField(Section)
    has_conflict = models.BooleanField(blank=True, default=False)

    