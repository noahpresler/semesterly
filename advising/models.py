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

class Advisor(models.Model):
    students = models.ManyToManyField(student_models.Student, related_name='advisors')
    jhed = models.CharField(max_length=255, null=True, default='')
    email_address = models.CharField(
        max_length=255, null=True, default='')
