# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
import student.models as student_models
import timetable.models as timetable_models


class Transcript(models.Model):
    owner = models.ForeignKey(student_models.Student, related_name='plan_forum_transcript')
    advisors = models.ManyToManyField(student_models.Student, related_name='student_forum_transcript')
    semester = models.ForeignKey(timetable_models.Semester, related_name='my_forum_transcript')


class Comment(models.Model):
    author = models.ForeignKey(student_models.Student, related_name='comment')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    transcript = models.ForeignKey(Transcript, related_name='comments')