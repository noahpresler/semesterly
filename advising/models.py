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

""" Models pertaining to Students. """

from django.db import models
import student.models as student_models
import timetable.models as timetable_models
# from models import User

# Create your models here.
# Sebastian Notes to self ->
# map section object (timetable) in object
# course object to map to offering
# courseobjects.filter(id)
# function to create many-to-many property (enrollments from list of sections)
# two tables for each majors and minors

class Advisor(models.Model):
    student = models.ManyToManyField(student_models.Student)
    first_name = models.CharField(max_length=255, default='', null=True)
    last_name = models.CharField(max_length=255, default='', null=True)
    jhed_id = models.CharField(max_length=255, null=True, default='')
    email_address = models.CharField(
        max_length=255, null=True, default='')
    
    # Probably unnecessary
    # validate that student user has existing JHED id in db
    # def validate_student_jhed:


class Major(model.Model):
    majors_name = models.CharField(max_length=255, default='', null=True)
    student = models.ForeignKey(student_models.Student)

class Minor(model.Model):
    minors_name = models.CharField(max_length=255, default='', null=True)
    student = models.ForeignKey(student_models.Student)

class Section(model.Model):
    # match to appropriate offering name
    # TODO: Match course to correct existing course in course model
    sections = ManyToManyField(timetable_models.Course.code)
    section_id = ManyToManyField(timetable_models.Section.course_section_id)

    # filter timetable_courses for course on student schedule
    def filter_courses:
        
