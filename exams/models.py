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

from django.db import models
from jsonfield import JSONField

from student.models import Student


class FinalExamShare(models.Model):
    """ Database object representing a shared final exam schedule.
       A final exam schedule belongs to a Student and contains the list of
       classes which the user needs to check finals for
    """
    school = models.CharField(max_length=50)
    student = models.ForeignKey(Student, null=True, default=None, on_delete=models.deletion.CASCADE)
    exam_json = JSONField()
    last_updated = models.DateTimeField(auto_now=True)