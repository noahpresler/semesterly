from django.db import models
from django.contrib.auth.models import User
from timetable.models import *

class Student(models.Model):
    FRESHMAN = 'FR'
    SOPHOMORE = 'SO'
    JUNIOR = 'JR'
    SENIOR = 'SR'
    YEAR_IN_SCHOOL_CHOICES = (
        (FRESHMAN, 'Freshman'),
        (SOPHOMORE, 'Sophomore'),
        (JUNIOR, 'Junior'),
        (SENIOR, 'Senior'),
    )
    class_year = models.CharField(max_length=2,
                                    choices=YEAR_IN_SCHOOL_CHOICES,
                                    blank=True)
    user = models.OneToOneField(User)
    img_url = models.CharField(max_length=300, default=-1)
    friends = models.ManyToManyField("self", blank=True)
    fbook_uid = models.CharField(max_length=255, default='')
    gender = models.CharField(max_length=255, default='')
    major = models.CharField(max_length=255, default='')
    social_courses = models.NullBooleanField(null=True)
    social_offerings = models.NullBooleanField(null=True)

class PersonalTimetable(models.Model):
    name = models.CharField(max_length=100)
    semester = models.CharField(max_length=2)
    time_updated = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(Student)
    school = models.CharField(max_length=50)
    last_updated = models.DateTimeField(auto_now=True)

class UofTPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(CourseOffering)
    courses = models.ManyToManyField(Course)

class HopkinsPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(HopkinsCourseOffering)
    courses = models.ManyToManyField(HopkinsCourse)

class UmdPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(UmdCourseOffering)
    courses = models.ManyToManyField(UmdCourse)

class RutgersPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(RutgersCourseOffering)
    courses = models.ManyToManyField(RutgersCourse)
    