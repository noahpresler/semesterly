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

from timetable.models import Course, Integration, CourseIntegration
from helpers.test.test_cases import UrlTestCase
from helpers.test.extensions import TestCaseWithElastic


class UrlsTest(UrlTestCase):
    """ Test integrations/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/integrations/1234/course/5678/', 'integrations.views.IntegrationsView',
                                     kwargs={'integration_id': '1234', 'course_id': '5678'})


class IntegrationsGetAddTest(TestCaseWithElastic, APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def setUp(self):
        Integration.objects.create(id=1, name='myint')
        Course.objects.create(id=1, school='uoft', code='SEA101', name='Intro')
        CourseIntegration.objects.create(course_id=1, integration_id=1, json='oldstuff')

    def test_get_existing_integration(self):
        response = self.client.get('/integrations/1/course/1/', format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_nonexistent_integration(self):
        response = self.client.get('/integrations/5/course/3/', format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_integration(self):
        data = {'json': 'newstuff'}
        response = self.client.post('/integrations/1/course/1/', data, format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        CourseIntegration.objects.get(course_id=1, integration_id=1, **data)


class IntegrationsDeleteTest(TestCaseWithElastic, APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def setUp(self):
        Integration.objects.create(id=1, name='myint')
        Course.objects.create(id=1, school='uoft', code='SEA101', name='Intro')
        CourseIntegration.objects.create(course_id=1, integration_id=1, json='oldstuff')

    def test_delete_integration(self):
        response = self.client.delete('/integrations/1/course/1/', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CourseIntegration.objects.filter(course_id=1, integration_id=1).exists())
