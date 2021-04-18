# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
import student.models as student_models
import timetable.models as timetable_models
from advising.models import Advisor


class Transcript(models.Model):
    """
    Represents a conversation between an Advisor and a Student for a single
    semester. Students have one Transcript per semester.

    Attributes:
        owner (:obj:`Student`): The student who owns this transcript
        advisors (:obj:`ManyToManyField` of :obj:`Student`): The list of
            authenticated advisors the student has invited
        pending_advisors (:obj:`ManyToManyField` of :obj:`Advisor`): The list
            unauthenticated advisors the student has invited
        semester (:obj:`Semester`): The semester this transcript is for
    """
    owner = models.ForeignKey(student_models.Student,
                              related_name='owned_transcripts')
    advisors = models.ManyToManyField(
        student_models.Student, related_name='invited_transcripts')
    pending_advisors = models.ManyToManyField(
        Advisor, related_name='invited_transcripts')
    semester = models.ForeignKey(timetable_models.Semester)

    class Meta:
        unique_together = ['owner', 'semester']


class Comment(models.Model):
    """
    Represents a single message sent inside of a Transcript.

    Attributes:
        author (:obj:`Student`): The user who sent this comment
        content (:obj:`TextField`): The actual message
        timestamp (:obj:`DateTimeField`): The time the comment was sent
        transcript (:obj:`Transcript`): The transcript this comment was sent in
    """
    author = models.ForeignKey(student_models.Student)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    transcript = models.ForeignKey(Transcript, related_name='comments')
