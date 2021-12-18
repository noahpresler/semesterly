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
from rest_framework.test import APITestCase, APIRequestFactory
from student.models import RegistrationToken
from helpers.test.test_cases import UrlTestCase
from helpers.test.utils import create_user, create_student, get_response, get_auth_response


class UrlsTest(UrlTestCase):
    """Test student/urls.py"""

    def test_urls_call_correct_views(self):
        # facebook login
        self.assertUrlResolvesToView(
            "/login/facebook/", "social:begin", kwargs={"backend": "facebook"}
        )
        self.assertUrlResolvesToView(
            "/complete/facebook/", "social:complete", kwargs={"backend": "facebook"}
        )

        # jhed login
        self.assertUrlResolvesToView(
            "/login/azuread-tenant-oauth2/",
            "social:begin",
            kwargs={"backend": "azuread-tenant-oauth2"},
        )
        self.assertUrlResolvesToView(
            "/complete/azuread-tenant-oauth2/",
            "social:complete",
            kwargs={"backend": "azuread-tenant-oauth2"},
        )

        # registration
        self.assertUrlResolvesToView(
            "/registration-token/", "authpipe.views.RegistrationTokenView"
        )
        self.assertUrlResolvesToView(
            "/registration-token/google/",
            "authpipe.views.RegistrationTokenView",
            kwargs={"endpoint": "google"},
        )


class TestToken(APITestCase):
    """Test setting and deleting tokens"""

    def setUp(self):
        school = "uoft"
        self.request_headers = {"HTTP_HOST": "{}.sem.ly:8000".format(school)}
        self.token = {
            "auth": "someauth",
            "p256dh": "something",
            "endpoint": "some endpoint",
        }
        self.factory = APIRequestFactory()

    def test_create_token(self):
        """Test creating a new token."""
        request = self.factory.put(
            "/registration-token/",
            data=self.token,
            format="json",
            **self.request_headers
        )
        response = get_response(request, "/registration-token/")
        self.assert_token_data(response, self.token)

    def assert_token_data(self, response, token):
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertDictContainsSubset(token, response.data)
        self.assertIsNotNone(RegistrationToken.objects.get(endpoint=token["endpoint"]))

    def setUpAuth(self):
        self.user = create_user()
        self.student = create_student(self.user)

    def putTokenAuth(self, data):
        return self.factory.put(
            "/registration-token/", data=data, format="json", **self.request_headers
        )

    def test_create_token_student(self):
        """Test creating a new token when logged in."""
        self.setUpAuth()
        request = self.putTokenAuth(self.token)
        response = get_auth_response(request, self.user, "/registration-token/")
        self.assert_token_data(response, self.token)

    def test_set_token(self):
        """Test updating an existing token."""
        self.test_create_token_student()
        new_token = {
            "auth": "somenewauth",
            "p256dh": "somenewthing",
            "endpoint": "somenew endpoint",
        }
        request = self.putTokenAuth(new_token)
        response = get_auth_response(request, self.user, "/registration-token/")
        self.assert_token_data(response, new_token)

    def test_delete_token_exists(self):
        """Test deleting an existing token."""
        token = RegistrationToken.objects.create(auth="a", p256dh="p", endpoint="e")
        response = self.client.delete(
            "/registration-token/{}/".format(token.endpoint), **self.request_headers
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            RegistrationToken.objects.filter(endpoint=token.endpoint).exists()
        )

    def test_delete_token_not_exists(self):
        """Test deleting a non existent token."""
        response = self.client.delete(
            "/registration-token/bla/", **self.request_headers
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
