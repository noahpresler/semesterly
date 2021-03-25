# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
import student.models as student_models
import timetable.models as timetable_models

class Transcript(models.Model):
    owner = models.ForeignKey(student_models.Student, related_name='owner')
    advisors = models.ManyToManyField(student_models.Student, related_name='advisors')
    semester_id = models.ForeignKey(timetable_models.Semester)

class Comment(models.Model):
    author = models.ForeignKey(student_models.Student)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    transcript_id = models.ForeignKey(Transcript)