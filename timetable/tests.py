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
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from helpers.test.data import get_default_tt_request

from analytics.models import SharedTimetable
from timetable.models import Semester, Course, Section, Offering
from timetable.utils import DisplayTimetable
from timetable.serializers import DisplayTimetableSerializer
from student.models import Student, PersonalTimetable, PersonalEvent
from helpers.test.test_cases import UrlTestCase


class Serializers(TestCase):

    def setUp(self):
        self.sem_name = 'Winter'
        self.year = '1995'
        self.cid = 1
        self.name = 'Intro'
        self.code = 'SEM101'
        self.school = 'uoft'
        self.sem = Semester.objects.create(name=self.sem_name, year=self.year)
        self.course = Course.objects.create(
            id=self.cid,
            school=self.school,
            code=self.code,
            name=self.name)
        self.section = Section.objects.create(
            course=self.course, semester=self.sem, meeting_section='L1')
        self.offering = Offering.objects.create(
            section=self.section,
            day='M',
            date_start='08-29-1995',
            date_end='12-10-1995',
            time_start='8:00',
            time_end='10:00',
            is_short_course=False)
        self.event = PersonalEvent.objects.create(name='gym', day='T',
                                                  time_start='7:00', time_end='8:30')

        self.user = User.objects.create_user(username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)

    def test_shared_timetable_serialization(self):
        timetable = SharedTimetable.objects.create(semester=self.sem, school='uoft',
                                                   has_conflict=False)
        timetable.courses.add(self.course)
        timetable.sections.add(self.section)

        display = DisplayTimetable.from_model(timetable)
        self.assertEqual(len(display.slots), 1)
        self.assertIsInstance(display.slots[0].course, Course)

        serialized = DisplayTimetableSerializer(display).data
        self.assertEqual(len(serialized['slots']), 1)
        self.assertIsInstance(serialized['slots'][0]['course'], int)
        self.assertEqual(len(serialized['events']), 0)

    def test_personal_timetable_serialization(self):
        timetable = PersonalTimetable.objects.create(semester=self.sem, school='uoft',
                                                     has_conflict=False, student=self.student)
        timetable.courses.add(self.course)
        timetable.sections.add(self.section)
        timetable.events.add(self.event)

        display = DisplayTimetable.from_model(timetable)
        self.assertEqual(len(display.slots), 1)
        self.assertIsInstance(display.slots[0].course, Course)

        serialized = DisplayTimetableSerializer(display).data
        self.assertEqual(len(serialized['slots']), 1)
        self.assertIsInstance(serialized['slots'][0]['course'], int)
        self.assertEqual(len(serialized['events']), 1)


class UrlsTest(UrlTestCase):
    """ Test timetable/urls.py """

    def test_urls_call_correct_views(self):
        # marketing urls
        self.assertUrlResolvesToView('/signin/',
                                     'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView('/signup/',
                                     'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView('/textbooks/',
                                     'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView('/export_calendar/',
                                     'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView('/notifyme/',
                                     'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView('/find_friends/',
                                     'helpers.mixins.FeatureFlowView')
        # self.assertUrlResolvesToView('/callback/google_calendar/','helpers.mixins.FeatureFlowView')

        # redirects
        self.assertUrlResolvesToView('/timetable/random_stuff',
                                     'django.views.generic.base.RedirectView')
        self.assertUrlResolvesToView(
            '/timetable/', 'django.views.generic.base.RedirectView')

        # timetables
        self.assertUrlResolvesToView(
            '/timetables/', 'timetable.views.TimetableView')

        # timetable sharing
        self.assertUrlResolvesToView(
            '/timetables/links/',
            'timetable.views.TimetableLinkView')
        self.assertUrlResolvesToView(
            '/timetables/links/SecAV/',
            'timetable.views.TimetableLinkView')


class TimetableViewTest(APITestCase):
    fixtures = ['uoft_fall_sample.json']
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def test_create_timetable(self):
        request_data = get_default_tt_request()
        request_data.update({
            'updated_courses': [
                {'course_id': 6090, 'section_codes': ['']},
                {'course_id': 6076, 'section_codes': ['']}
            ]})

        response = self.client.post(
            '/timetables/',
            request_data,
            format='json',
            **self.request_headers)
        self.assertEqual(response.status_code, 200)

        self.assertEqual(len(response.data['new_c_to_s']), 2)
        self.assertEqual(len(response.data['timetables']), 7)


class TimetableLinkViewTest(APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def setUp(self):
        sem = Semester.objects.create(name='Fall', year='2000')
        course = Course.objects.create(
            id=1, school='uoft', code='SEM101', name='Intro')
        section = Section.objects.create(
            id=1, course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(
            section=section,
            day='M',
            date_start='08-29-2000',
            date_end='12-10-2000',
            time_start='8:00',
            time_end='10:00',
            is_short_course=False)

    def test_create_then_get_link(self):
        data = {
            'timetable': {
                'slots': [{
                    'course': 1,
                    'section': 1,
                    'offerings': []
                }],
                'has_conflict': False
            },
            'semester': {'name': 'Fall', 'year': '2000'}
        }
        response = self.client.post(
            '/timetables/links/',
            data,
            format='json',
            **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('slug', response.data)

        slug = response.data['slug']

        # assumes that the response will be a 404 if post did not actually
        # create a shared timetable
        response = self.client.get(
            '/timetables/links/{}/'.format(slug),
            **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
