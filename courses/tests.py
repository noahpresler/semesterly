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

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from timetable.models import Semester, Course, Section, Offering
from parsing.models import DataUpdate
from helpers.test.test_cases import UrlTestCase
from .serializers import CourseSerializer


class Serializers(TestCase):
    def test_course_serialization(self):
        self.sem_name = 'Winter'
        self.year = '1995'
        self.cid = 1
        self.name = 'Intro'
        self.code = 'SEM101'
        self.school = 'uoft'
        sem = Semester.objects.create(name=self.sem_name, year=self.year)
        course = Course.objects.create(
            id=self.cid,
            school=self.school,
            code=self.code,
            name=self.name)
        section = Section.objects.create(
            course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(
            section=section,
            day='M',
            date_start='08-29-1995',
            date_end='12-10-1995',
            time_start='8:00',
            time_end='10:00',
            is_short_course=False)

        serialized = CourseSerializer(course, context={
            'semester': sem,
            'school': self.school,
            'sections': [section],
        })

        self.assertTrue(serialized.data['code'] == self.code)


class CourseDetail(APITestCase):
    school = 'uoft'
    search_endpoint = 'search'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def setUp(self):
        self.sem_name = 'Winter'
        self.year = '1995'
        self.cid = 1
        self.name = 'Intro'
        self.code = 'SEM101'
        sem = Semester.objects.create(name=self.sem_name, year=self.year)
        course = Course.objects.create(
            id=self.cid,
            school=self.school,
            code=self.code,
            name=self.name)
        section = Section.objects.create(
            course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(
            section=section,
            day='M',
            date_start='08-29-1995',
            date_end='12-10-1995',
            time_start='8:00',
            time_end='10:00',
            is_short_course=False)

    def test_course_exists(self):
        response = self.client.get('/courses/{}/{}/id/{}'.format(self.sem_name, self.year, self.cid),
                                   **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        course_info = response.json()
        self.assertEqual(course_info['name'], self.name)
        self.assertEqual(course_info['code'], self.code)

    def test_no_course_exists(self):
        response = self.client.get('/courses/{}/{}/id/{}'.format(self.sem_name, self.year, self.cid + 1),
                                   **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SchoolListTest(APITestCase):
    school = 'uoft'

    def setUp(self):
        self.areas = ['area']
        self.departments = 'math'
        self.level = 'hard'
        Course.objects.create(school=self.school,
                              code='SEA101',
                              name='Intro',
                              areas=self.areas,
                              department=self.departments,
                              level=self.level)
        semester, _ = Semester.objects.update_or_create(name='Fall',
                                                        year='2017')
        DataUpdate.objects.create(school=self.school,
                                  update_type=DataUpdate.COURSES,
                                  semester=semester)

    def test_school_exists(self):
        response = self.client.get('/school/{}/'.format(self.school))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        school_info = response.data
        self.assertNotEqual(len(school_info['areas']), 0)
        self.assertNotEqual(len(school_info['departments']), 0)
        self.assertNotEqual(len(school_info['levels']), 0)
        self.assertIsNotNone(school_info['last_updated'])

    def test_school_does_not_exist(self):
        response = self.client.get('/school/{}/'.format('notuoft'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        school_info = response.data
        self.assertEqual(len(school_info['areas']), 0)
        self.assertEqual(len(school_info['departments']), 0)
        self.assertEqual(len(school_info['levels']), 0)
        self.assertIsNone(school_info['last_updated'])


class UrlsTest(UrlTestCase):
    """ Test courses/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            '/c/somecode0350!',
            'courses.views.course_page')
        self.assertUrlResolvesToView(
            '/course/music101/Summer/2021',
            'courses.views.CourseModal')
        self.assertUrlResolvesToView('/courses', 'courses.views.all_courses')

        self.assertUrlResolvesToView(
            '/courses/Fall/2019/id/82',
            'courses.views.CourseDetail')
        self.assertUrlResolvesToView(
            '/school/uoft/',
            'courses.views.SchoolList',
            kwargs={
                'school': 'uoft'})
