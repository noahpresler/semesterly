# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib.auth.models import User
from django.test import TestCase
from django.core.urlresolvers import resolve
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from helpers.test.test_cases import UrlTestCase

from forum.models import Comment, Transcript
from student.models import Student
from timetable.models import Semester
from serializers import TranscriptSerializer, CommentSerializer
import datetime


def setUpTranscript(self):
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
    self.transcript.advisors.add(self.advisor)


def add_comment(self, author, content):
    timestamp = datetime.datetime.now()
    return Comment.objects.create(
        author=author,
        content=content,
        timestamp=timestamp,
        transcript=self.transcript,
    )


def get_response(self, request, user):
    force_authenticate(request, user=user)
    request.user = user
    request.subdomain = 'uoft'
    view = resolve('/forum/all/').func
    return view(request)


class Serializers(TestCase):
    def setUp(self):
        setUpTranscript(self)

    def test_comment_serialization(self):
        content = 'I play Pokemon GO every day.'
        author = self.student
        comment = add_comment(self, author, content)

        serialized = CommentSerializer(comment).data
        self.assertEquals(author.get_full_name(),
                          serialized['author_name'])
        self.assertEquals(content, serialized['content'])

    def assert_comment(self, expected, actual):
        self.assertEquals(expected['author_name'], actual['author_name'])
        self.assertEquals(expected['content'], actual['content'])

    def test_transcript_serialization(self):
        student_comment = add_comment(self, self.student, "Jason's a god")
        advisor_comment = add_comment(self, self.advisor, "Who's Jason?")

        serialized = TranscriptSerializer(self.transcript).data
        s = CommentSerializer(student_comment).data
        a = CommentSerializer(advisor_comment).data
        self.assert_comment(s, serialized['comments'][0])
        self.assert_comment(a, serialized['comments'][1])
        self.assertEquals(self.semester.name, serialized['semester_name'])
        self.assertEquals(self.semester.year, serialized['semester_year'])
        self.assertEquals(self.student.get_full_name(),
                          serialized['owner_name'])
        self.assertEquals(self.advisor.get_full_name(),
                          serialized['advisor_names'][0])


class UrlsTest(UrlTestCase):
    """ Test forum/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/forum/all/', 'forum.views.ForumView')
        self.assertUrlResolvesToView(
            '/forum/Fall/2016/',
            'forum.views.ForumTranscriptView',
            kwargs={'sem_name': 'Fall', 'year': '2016'})


class ForumViewTest(APITestCase):
    def setUp(self):
        setUpTranscript(self)
        self.factory = APIRequestFactory()

    def test_get_forums_student(self):
        add_comment(self, self.student, 'Hello good sir')
        request = self.factory.get('/forum/all/', format='json')
        response = get_response(self, request, self.student.user)

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        expected = TranscriptSerializer(self.transcript).data
        actual = response.data['owned_transcripts'][0]
        self.assertEquals(expected, actual)

    def test_get_forums_advisor(self):
        add_comment(self, self.student, 'You take care')
        request = self.factory.get('/forum/all/', format='json')
        response = get_response(self, request, self.advisor.user)

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        expected = TranscriptSerializer(self.transcript).data
        actual = response.data['invited_transcripts'][0]
        self.assertEquals(expected, actual)


class ForumTranscriptViewTest(APITestCase):
    pass
