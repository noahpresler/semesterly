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
import timetable.models as timetable_models
# from models import User

# Create your models here.
# Sebastian Notes to self ->
# map section object (timetable) in object
# course object to map to offering
# courseobjects.filter(id)
# function to create many-to-many property (enrollments from list of sections)
# two tables for each majors and minors


class Student(models.Model):
    first_name = models.CharField(max_length=255, default='', null=True)
    last_name = models.CharField(max_length=255, default='', null=True)
    jhed_id = models.CharField(max_length=255, null=True, default='')
    primary_major = models.CharField(
        max_length=255, null=True, default='Undecided')
    email_address = models.CharField(
        max_length=255, null=True, default='Undecided')
    # majors = models.ManyToOneField(Major) #TODO: foreign key or onetoone? or neither
    # minors = models.ManyToOneField(Minor)


class Advisor(models.Model):
    students = models.ManyToManyField(models.Student)


class Major(model.Model):
    majors_name = models.CharField(max_length=255, default='', null=True)


class Minor(model.Model):
    minors_name = models.CharField(max_length=255, default='', null=True)

class Section(model.Model):
    # match to appropriate offering name
    sections = ManyToManyField(timetable_models.Course.code)
    section_id = ManyToManyField(timetable_models.Section.course_section_id)
