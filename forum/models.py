# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

class Comment(models.Model):
    author = models.ForeignKey('student.Student')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    transcript_id = models.ForeignKey('forum.Transcript')

class Transcript(models.Model):
    owner = models.ForeignKey('student.Student')
    advisors = models.ManyToManyField('student.Student')
    semester_id = models.ForeignKey('timetable.Semester')