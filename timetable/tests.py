from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from helpers.test.data import get_default_tt_request

from timetable.models import Semester, Course, Section, Offering
from helpers.test.test_cases import UrlTestCase


class Serializers(TestCase):

    def test_timetable_serialization(self):
        # TODO: readd for DisplayTimetable
        # self.sem_name = 'Winter'
        # self.year = '1995'
        # self.cid = 1
        # self.name = 'Intro'
        # self.code = 'SEM101'
        # self.school = 'uoft'
        # sem = Semester.objects.create(name=self.sem_name, year=self.year)
        # course = Course.objects.create(
        #     id=self.cid,
        #     school=self.school,
        #     code=self.code,
        #     name=self.name)
        # section = Section.objects.create(
        #     course=course, semester=sem, meeting_section='L1')
        # Offering.objects.create(
        #     section=section,
        #     day='M',
        #     time_start='8:00',
        #     time_end='10:00')
        #
        # my_tt = Timetable(courses=[course], sections=[section], has_conflict=False)
        # serialized = TimetableSerializer(my_tt)
        #
        # self.assertEqual(serialized.data['courses'][0]['code'], self.code)
        # self.assertEqual(serialized.data['semester']['name'], self.sem_name)
        pass


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
        self.assertUrlResolvesToView('/callback/google_calendar/',
                                     'helpers.mixins.FeatureFlowView')

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
            time_start='8:00',
            time_end='10:00')

    def test_create_then_get_link(self):
        data = {
            'timetable': {
                'slots': [{
                    'course': {'id': 1},
                    'section': {'id': 1},
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
