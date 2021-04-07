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
from __future__ import unicode_literals

from django.contrib.auth.models import User
from django.test import TestCase
from django.core.urlresolvers import resolve
from django.db.models import Model
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from helpers.test.test_cases import UrlTestCase

from forum.models import Comment, Transcript
from student.models import Student
from timetable.models import Semester
from serializers import TranscriptSerializer, CommentSerializer
import datetime


def setUpTranscriptDependencies(self):
    """Creates a student and advisor Student model and semester Fall 2019"""
    user = User.objects.create_user(
        username='JJam',
        password='XD',
        first_name='James',
        last_name='Wang',)
    self.student = Student.objects.create(user=user)
    self.student.jhed = 'jwang380'
    self.student.save()
    user = User.objects.create_user(
        username='rbiz',
        password='k',
        first_name='Rishi',
        last_name='Biswas',)
    self.advisor = Student.objects.create(user=user)
    self.advisor.jhed = 'rbiswas4'
    self.advisor.save()
    self.semester = Semester.objects.create(name='Fall', year='2019')
    self.semester.save()


def setUpTranscriptDependenciesNoAdvisor(self):
    """Creates a student and semester Fall 2019"""
    user = User.objects.create_user(
        username='JJam',
        password='XD',
        first_name='James',
        last_name='Wang',)
    self.student = Student.objects.create(user=user)
    self.student.jhed = 'jwang380'
    self.student.save()
    self.semester = Semester.objects.create(name='Fall', year='2019')
    self.semester.save()


def setUpTranscript(self):
    """Creates a transcript for the student and adds the advisor to it."""
    setUpTranscriptDependencies(self)
    self.transcript = Transcript.objects.create(
        owner=self.student,
        semester=self.semester,
    )
    self.transcript.advisors.add(self.advisor)


def setUpTranscriptNoAdvisor(self):
    """Creates a transcript for the student without an advisor"""
    setUpTranscriptDependenciesNoAdvisor(self)
    self.transcript = Transcript.objects.create(
        owner=self.student,
        semester=self.semester,
    )


def add_comment(self, author, content):
    """Returns a comment with the author, content, and time set to now"""
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
    view = resolve('/advising/forum/all/').func
    return view(request)


def get_response_for_semester(self, request, user):
    force_authenticate(request, user=user)
    request.user = user
    request.subdomain = 'uoft'
    view = resolve('/advising/forum/Fall/2019/').func
    return view(request, 'Fall', '2019')


class Serializers(TestCase):
    """Tests the TranscriptSerializer and CommentSerializer
    Note: Does not check the comment's timestamp due to formatting issues
    (Feel free to write it in)
    """

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


class UrlsTest(TestCase, UrlTestCase):
    """ Test forum/urls.py """

    def setUp(self):
        semester = Semester.objects.create(name='Fall', year='2016')
        semester.save()

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            '/advising/forum/all/', 'forum.views.ForumView')
        self.assertUrlResolvesToView(
            '/advising/forum/Fall/2016/',
            'forum.views.ForumTranscriptView',
            kwargs={'sem_name': 'Fall', 'year': '2016'})


class ForumViewTest(APITestCase):
    def setUp(self):
        setUpTranscript(self)
        self.factory = APIRequestFactory()

    def test_get_forums_student(self):
        add_comment(self, self.student, 'Hello good sir')
        request = self.factory.get('/advising/forum/all/', format='json')
        response = get_response(self, request, self.student.user)

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        expected = TranscriptSerializer(self.transcript).data
        actual = response.data['owned_transcripts'][0]
        self.assertEquals(expected, actual)

    def test_get_forums_advisor(self):
        add_comment(self, self.student, 'You take care')
        request = self.factory.get('/advising/forum/all/', format='json')
        response = get_response(self, request, self.advisor.user)

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        expected = TranscriptSerializer(self.transcript).data
        actual = response.data['invited_transcripts'][0]
        self.assertEquals(expected, actual)


class ForumTranscriptViewTest(APITestCase):
    """Notes:
        "existent" means in the database with an associated user/Student.
        "added/removed" means added/removed to/from the testing Transcript.
    """

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_get_transcript(self):
        setUpTranscript(self)
        add_comment(self, self.advisor, 'Jihyun is cool')
        request = self.factory.get('/advising/forum/Fall/2019/', format='json')
        response = get_response_for_semester(self, request, self.student.user)

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        expected = TranscriptSerializer(self.transcript).data
        actual = response.data['transcript']
        self.assertEquals(expected, actual)

    def test_create_transcript(self):
        setUpTranscriptDependencies(self)
        request = self.factory.put('/advising/forum/Fall/2019/', format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        transcript = Transcript.objects.get(
            semester=self.semester, owner=self.student)

    def test_delete_transcript(self):
        setUpTranscript(self)
        request = self.factory.delete(
            '/advising/forum/Fall/2019/', format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(Transcript.DoesNotExist):
            Transcript.objects.get(semester=self.semester, owner=self.student)

    def test_create_comments(self):
        setUpTranscript(self)
        content = 'Stan Oh My Girl, fromis_9, f(x), LOONA'
        data = {
            'content': content,
            'timestamp': datetime.datetime.now(),
            'jhed': self.student.jhed,
        }
        request = self.factory.post(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        comment = Comment.objects.get(
            transcript=self.transcript, author=self.student)
        self.assertEquals(content, comment.content)

        content = 'Stan YUKIKA - literally Simon'
        data = {
            'content': content,
            'timestamp': datetime.datetime.now(),
            'jhed': self.student.jhed,
        }
        request = self.factory.post(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.advisor.user)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        comment = Comment.objects.get(
            transcript=self.transcript, author=self.advisor)
        self.assertEquals(content, comment.content)

    def test_add_advisor(self):
        setUpTranscriptNoAdvisor(self)
        self.assertEquals(self.transcript.advisors.count(), 0)
        user = User.objects.create_user(
            username='rbiz',
            password='k',
            first_name='Rishi',
            last_name='Biswas',)
        advisor = Student.objects.create(user=user)
        advisor.jhed = 'rbiswas4'
        advisor.save()
        data = {
            'action': 'add',
            'jhed': advisor.jhed,
        }
        request = self.factory.patch(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(self.transcript.advisors.count(), 1)

    def test_add_nonexistent_advisor(self):
        setUpTranscriptNoAdvisor(self)
        self.assertEquals(self.transcript.advisors.count(), 0)
        data = {
            'action': 'add',
            'jhed': 'rbiswas4',
        }
        request = self.factory.patch(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEquals(self.transcript.advisors.count(), 0)

    def test_add_added_advisor(self):
        setUpTranscript(self)
        self.assertEquals(self.transcript.advisors.count(), 1)
        data = {
            'action': 'add',
            'jhed': 'rbiswas4',
        }
        request = self.factory.patch(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(self.transcript.advisors.count(), 1)

    def test_remove_advisor(self):
        setUpTranscript(self)
        self.assertEquals(self.transcript.advisors.count(), 1)
        data = {
            'action': 'remove',
            'jhed': self.advisor.jhed,
        }
        request = self.factory.patch(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(self.transcript.advisors.count(), 0)

    def test_remove_nonexistent_advisor(self):
        setUpTranscript(self)
        data = {
            'action': 'remove',
            'jhed': 'scabrej1jfung4',
        }
        request = self.factory.patch(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEquals(self.transcript.advisors.count(), 1)

    def test_remove_removed_advisor(self):
        self.test_remove_advisor()
        self.assertEquals(self.transcript.advisors.count(), 0)
        data = {
            'action': 'remove',
            'jhed': self.advisor.jhed,
        }
        request = self.factory.patch(
            '/advising/forum/Fall/2019/', data=data, format='json')
        response = get_response_for_semester(self, request, self.student.user)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(self.transcript.advisors.count(), 0)
