from __future__ import unicode_literals

from django.db import models
from student import models as student_models

class FinalExamShare(models.Model):
    """ Database object representing a shared final exam schedule.

       A final exam schedule belongs to a Student and contains the list of
       classes which the user needs to check finals for
    """
    school = models.CharField(max_length=50)
    student = models.ForeignKey(student_models.Student)
    exam_json = models.TextField(default='')
    last_updated = models.DateTimeField(auto_now=True)