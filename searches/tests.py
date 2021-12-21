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


def setUpTests(self):
    sem = Semester.objects.create(name="Winter", year="1995")
    course = Course.objects.create(
        school=self.school,
        code="SEA101",
        name="Intro",
        level=100,
    )
    section = Section.objects.create(
        course=course, semester=sem, meeting_section="L1", section_type="L"
    )
    Offering.objects.create(
        section=section,
        day="M",
        date_start="08-29-1995",
        date_end="12-10-1995",
        time_start="8:00",
        time_end="10:00",
        is_short_course=False,
    )


def assertEmptyResponse(self, body, url):
    response = self.client.post(url, body, format="json", **self.request_headers)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 0)


def assertNonemptyResponse(self, body, url):
    response = self.client.post(url, body, format="json", **self.request_headers)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertNotEqual(len(response.data), 0)


class BasicSearchTest(APITestCase):
    school = "uoft"
    request_headers = {"HTTP_HOST": "{}.sem.ly:8000".format(school)}

    def setUp(self):
        setUpTests(self)

    def test_search_partial(self):
        assertNonemptyResponse(self, {}, "/search/Winter/1995/int")

    def test_search_exact(self):
        assertNonemptyResponse(self, {}, "/search/Winter/1995/Intro")

    def test_search_empty(self):
        assertEmptyResponse(self, {}, "/search/Winter/1995/asdf")


class AdvancedSearchTest(APITestCase):
    school = "uoft"
    request_headers = {"HTTP_HOST": "{}.sem.ly:8000".format(school)}

    def setUp(self):
        setUpTests(self)

    def test_course_exists(self):
        assertNonemptyResponse(self, {}, "/search/Winter/1995/sea/")

    def test_no_course_exists(self):
        assertEmptyResponse(self, {}, "/search/Fall/2016/sea/")

    def test_right_course(self):
        response = self.client.post(
            "/search/Winter/1995/sea/", format="json", **self.request_headers
        )
        courses = response.data
        self.assertEquals(1, len(courses))
        self.assertEquals("SEA101", courses[0]["code"])
        self.assertEquals("Intro", courses[0]["name"])

    def test_no_filter(self):
        assertEmptyResponse(self, {}, "/search/Winter/1995/none")
        assertNonemptyResponse(self, {}, "/search/Winter/1995/sea/")

    def test_filter_times(self):
        body = {"filters": {"times": [{"min": 12, "max": 20, "day": "Tuesday"}]}}
        assertEmptyResponse(self, body, "/search/Winter/1995/sea/")
        body = {"filters": {"times": [{"min": 8, "max": 20, "day": "Monday"}]}}
        assertNonemptyResponse(self, body, "/search/Winter/1995/sea/")

    def test_filter_levels(self):
        body = {"filters": {"levels": [200]}}
        assertEmptyResponse(self, body, "/search/Winter/1995/sea/")
        body = {"filters": {"levels": [100]}}
        assertNonemptyResponse(self, body, "/search/Winter/1995/sea/")

    def test_filter_areas(self):
        pass

    def test_filter_departments(self):
        pass


class UrlsTest(UrlTestCase):
    """Test search/urls.py"""

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            "/search/Intermission/2019/opencv/",
            "searches.views.CourseSearchList",
            kwargs={"sem_name": "Intermission", "year": "2019", "query": "opencv"},
        )
