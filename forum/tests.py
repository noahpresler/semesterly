# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APITestCase
from helpers.test.test_cases import UrlTestCase

from forum.models import Comment, Transcript
from student.models import Student
from timetable.models import Semester
from serializers import TranscriptSerializer, CommentSerializer
import datetime


class Serializers(TestCase):
    def setUp(self):
        user = User.objects.create_user(
            username='JJam',
            password='XD',
            first_name='James',
            last_name='Wang',)
        self.student = Student.objects.create(user=user)
        user = User.objects.create_user(
            username='rbiz',
            password='k',
            first_name='Rishi',
            last_name='Biswas',)
        self.advisor = Student.objects.create(user=user)
        self.semester = Semester.objects.create(name='Fall', year='2019')
        self.transcript = Transcript.objects.create(
            owner=self.student,
            semester=self.semester,
        )
    
    def add_comment(self, author, content):
        timestamp = datetime.datetime.now()
        return Comment.objects.create(
            author=author,
            content=content,
            timestamp=timestamp,
            transcript=self.transcript,
        )

    def test_comment_serialization(self):
        content = 'I play Pokemon GO every day.'
        author = self.student
        comment = self.add_comment(author, content)

        serialized = CommentSerializer(comment).data
        self.assertEquals(author.get_full_name(),
                          serialized['author_name'])
        self.assertEquals(content, serialized['content'])

    def test_transcript_serialization(self):
        pass


class UrlsTest(UrlTestCase):
    """ Test forum/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/forum/all/', 'forum.views.ForumView')
        self.assertUrlResolvesToView(
            '/forum/Fall/2016/',
            'forum.views.ForumTranscriptView',
            kwargs={'sem_name': 'Fall', 'year': '2016'})


class ForumViewTest(APITestCase):
    pass


class ForumTranscriptViewTest(APITestCase):
    pass
