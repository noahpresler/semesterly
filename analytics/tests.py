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

from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from helpers.test.test_cases import UrlTestCase
from .models import UIErrorLog


class UrlsTest(UrlTestCase):
    """Test analytics/urls.py"""

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            "/analytics/", "analytics.views.view_analytics_dashboard"
        )
        self.assertUrlResolvesToView(
            "/robots.txt", "analytics.views.view_analytics_dashboard"
        )
        self.assertUrlResolvesToView("/user/log_ical/", "student.views.log_ical_export")
        self.assertUrlResolvesToView(
            "/ui-error-logs/", "analytics.views.UIErrorLogCreateView"
        )


class UIErrorLogCreateViewTest(APITestCase):
    def setUp(self):
        self.request_data = {
            "name": "test name",
            "message": "test message",
            "stack": "test stack",
            "componentStack": "test componentStack",
        }
        self.user = User.objects.create_user(
            username="user", email="student@jhu.edu", password="password"
        )

    def test_add_new_log(self):
        response = self.client.post("/ui-error-logs/", self.request_data, format="json")
        self.assertEqual(response.status_code, 201)

        self.assertEqual(1, len(UIErrorLog.objects.all()))
        created = UIErrorLog.objects.all()[0]
        self.assert_attributes(created, None)

    def test_add_new_log_logged_in(self):
        self.client.force_login(self.user)
        response = self.client.post("/ui-error-logs/", self.request_data, format="json")
        self.assertEqual(response.status_code, 201)

        self.assertEqual(1, len(UIErrorLog.objects.all()))
        created = UIErrorLog.objects.all()[0]
        self.assert_attributes(created, self.user)

    def assert_attributes(self, created, user):
        self.assertEqual(created.name, self.request_data["name"])
        self.assertEqual(created.message, self.request_data["message"])
        self.assertEqual(created.stack, self.request_data["stack"])
        self.assertEqual(created.componentStack, self.request_data["componentStack"])
        self.assertEqual(created.user, user)
