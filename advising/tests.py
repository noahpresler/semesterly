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
from helpers.test.test_cases import UrlTestCase
from timetable.models import Semester
from helpers.mixins import FeatureFlowView
# from advising.models import Advisor
# from student.models import Student

class UrlsTest(TestCase, UrlTestCase):
    """ Test advising/urls.py """
    def setUp(self):
        semester = Semester.objects.create(name='Fall', year='2016')
        semester.save()

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            '/advising/jhu_signup/','helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView(
            '/advising/', 'advising.views.AdvisingView')
        self.assertUrlResolvesToView(
            '/advising/sis_post/', 'advising.views.StudentSISView')
        self.assertUrlResolvesToView(
            '/advising/sis_semesters/', 'advising.views.StudentSISView')    
        self.assertUrlResolvesToView(
            '/advising/sis_courses/Fall/2016/', 'advising.views.RegisteredCoursesView')    

# TODO: Write more tests for advising app.
