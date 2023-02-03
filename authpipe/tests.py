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
from helpers.test.test_cases import UrlTestCase
from helpers.test.utils import (
    create_user,
    create_student,
    get_response,
    get_auth_response,
)


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
