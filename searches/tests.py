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

from rest_framework import status
from rest_framework.test import APITestCase

from timetable.models import Course, Section, Offering, Semester
from helpers.test.test_cases import UrlTestCase
from searches.utils import Vectorizer

class BasicSearchTest(APITestCase):
    school = 'uoft'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def setUp(self):
        sem = Semester.objects.create(name='Winter', year='1995')
        course = Course.objects.create(school=self.school, code='SEA101', name='Intro', description="awesome")
        section = Section.objects.create(course=course, semester=sem, meeting_section='L1', section_type='L')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')

    def test_course_exists(self):
        response =  self.client.get('/search/Winter/1995/sea/', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(len(response.data),  0)

    def test_no_course_exists(self):
        response = self.client.get('/search/Fall/2016/sea/', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_description_exist(self):
        return
        # response = self.client.get('/search/Winter/1995/awesome/', **self.request_headers)
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        # self.assertNotEqual(len(response.data), 0)


class AdvancedSearchTest(APITestCase):
    school = 'uoft'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def setUp(self):
        sem = Semester.objects.create(name='Winter', year='1995')
        course = Course.objects.create(school=self.school, code='SEA101', name='Intro')
        section = Section.objects.create(course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')

    def test_no_filter(self):
        response =  self.client.get('/search/Winter/1995/sea/', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(len(response.data),  0)

    def test_filter_times(self):
        body = {
            'filters': {
                'times': [{
                    'min': 12,
                    'max': 20,
                    'day': 'Tuesday'
                }]
            }
        }
        response =  self.client.post('/search/Winter/1995/sea/', body, format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data),  0)

    def test_filter_levels(self):
        body = {
            'filters': {
                'levels': [100]
            }
        }
        response =  self.client.post('/search/Winter/1995/sea/', body, format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data),  0)

    def test_pagination(self):
        pass


class UrlsTest(UrlTestCase):
    """ Test search/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/search/Intermission/2019/opencv/', 'searches.views.CourseSearchList',
                                     kwargs={'sem_name': 'Intermission', 'year': '2019', 'query': 'opencv'})