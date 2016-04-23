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
                                      default=FRESHMAN)
    user = models.OneToOneField(User)
    img_url = models.CharField(max_length=300, default=-1)
    friends = models.ManyToManyField("self", blank=True)
    fbook_uid = models.CharField(max_length=255, default='')
    major = models.CharField(max_length=255, default='')
    social_courses = models.BooleanField(default=False)
    social_offerings = models.BooleanField(default=False)

class PersonalTimetable(models.Model):
    semester = models.CharField(max_length=2)
    time_updated = models.DateTimeField(auto_now_add=True)
    # user = models.ForeignKey(Student)

    class Meta:
        abstract = True


class UofTPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(CourseOffering)

class HopkinsPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(HopkinsCourseOffering)

class UmdPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(UmdCourseOffering)

class RutgersPersonalTimetable(PersonalTimetable):
    course_offerings = models.ManyToManyField(RutgersCourseOffering)
