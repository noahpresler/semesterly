"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

from rest_framework import status
from rest_framework.test import APITestCase

from student.models import RegistrationToken
from helpers.test.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # auth
        self.assertUrlResolvesToView(
            '/login/facebook/',
            'social:begin',
            kwargs={
                'backend': 'facebook'})
        self.assertUrlResolvesToView(
            '/complete/facebook/',
            'social:complete',
            kwargs={
                'backend': 'facebook'})

        # registration
        self.assertUrlResolvesToView(
            '/registration-token/',
            'authpipe.views.RegistrationTokenView')
        self.assertUrlResolvesToView('/registration-token/google/', 'authpipe.views.RegistrationTokenView',
                                     kwargs={'endpoint': 'google'})


class TestToken(APITestCase):
    """ Test setting and deleting tokens """
    school = 'uoft'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def test_create_token(self):
        """ Test creating a new token. """
        my_token = {
            'auth': 'someauth',
            'p256dh': 'something',
            'endpoint': 'some endpoint'
        }

        response = self.client.put(
            '/registration-token/',
            data=my_token,
            format='json',
            **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertDictContainsSubset(my_token, response.json())
        self.assertIsNotNone(
            RegistrationToken.objects.get(
                endpoint='some endpoint'))

    def test_create_token_student(self):
        """ Test creating a new token when logged in. """
        pass

    def test_set_token(self):
        """ Test updating an existing token. """
        pass

    def test_delete_token_exists(self):
        """ Test deleting an existing token. """
        token = RegistrationToken.objects.create(
            auth='a', p256dh='p', endpoint='e')
        response = self.client.delete(
            '/registration-token/{}/'.format(token.endpoint), **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            RegistrationToken.objects.filter(
                endpoint=token.endpoint).exists())

    def test_delete_token_not_exists(self):
        """ Test deleting a non existent token. """
        response = self.client.delete(
            '/registration-token/bla/',
            **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
