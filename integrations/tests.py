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


class UrlsTest(UrlTestCase):
    """ Test integrations/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/integrations/1234/course/5678/', 'integrations.views.IntegrationsView',
                                     kwargs={'integration_id': '1234', 'course_id': '5678'})


class IntegrationsGetAddTest(APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def setUp(self):
        #get or create
        self.integration = Integration.objects.create(name='myint')
        self.integrationIdStr = str(self.integration.id)
        self.course = Course.objects.create(school='uoft', code='SEA101', name='Intro')
        self.courseIdStr = str(self.course.id)
        self.courseIntegration = CourseIntegration.objects.create(course_id=self.course.id, integration_id=self.integration.id, json='oldstuff')

    def test_get_existing_integration(self):
        response = self.client.get('/integrations/' + self.integrationIdStr + '/course/' + self.courseIdStr + '/', format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_nonexistent_integration(self):
        nonexistentIntegrationIdStr = str(self.integration.id + 1)
        nonexistentCourseIdStr = str(self.course.id + 1)
        response = self.client.get('/integrations/' + nonexistentIntegrationIdStr + '/course/' + nonexistentCourseIdStr + '/', format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_integration(self):
        data = {'json': 'newstuff'}
        response = self.client.post('/integrations/' + self.integrationIdStr + '/course/' + self.courseIdStr + '/', data, format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        CourseIntegration.objects.get(course_id=self.course.id, integration_id=self.integration.id, **data)


class IntegrationsDeleteTest(APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def setUp(self):
        self.integration = Integration.objects.create(name='myint')
        self.integrationIdStr = str(self.integration.id)
        self.course = Course.objects.create(school='uoft', code='SEA101', name='Intro')
        self.courseIdStr = str(self.course.id)
        self.courseIntegration = CourseIntegration.objects.create(course_id=self.course.id, integration_id=self.integration.id, json='oldstuff')

    def test_delete_integration(self):
        response = self.client.delete('/integrations/' + self.integrationIdStr + '/course/' + self.courseIdStr + '/', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CourseIntegration.objects.filter(course_id=self.course.id, integration_id=self.integration.id).exists())
