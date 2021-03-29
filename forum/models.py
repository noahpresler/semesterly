# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
import student.models as student_models
import timetable.models as timetable_models


class Transcript(models.Model):
    owner = models.ForeignKey(student_models.Student, related_name='owned_transcripts')
    advisors = models.ManyToManyField(student_models.Student, related_name='invited_transcripts')
    semester = models.ForeignKey(timetable_models.Semester)


class Comment(models.Model):
    author = models.ForeignKey(student_models.Student)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    transcript = models.ForeignKey(Transcript, related_name='comments')

    def get_author_name(self):
        return self.author.user.first_name + ' ' + self.author.user.last_name
