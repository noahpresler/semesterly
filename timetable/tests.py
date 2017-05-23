from rest_framework.test import APITestCase
from rest_framework import status

from test_utils.utils import get_default_tt_request
from test_utils.test_cases import UrlTestCase

from timetable.models import Semester, Course, Section, Offering


class UrlsTest(UrlTestCase):
    """ Test timetable/urls.py """

    def test_urls_call_correct_views(self):
        # marketing urls
        self.assertUrlResolvesToView('/signin/',
         'timetable.utils.FeatureFlowView')
        self.assertUrlResolvesToView('/signup/',
         'timetable.utils.FeatureFlowView')
        self.assertUrlResolvesToView('/textbooks/',
         'timetable.utils.FeatureFlowView')
        self.assertUrlResolvesToView('/export_calendar/',
         'timetable.utils.FeatureFlowView')
        self.assertUrlResolvesToView('/notifyme/',
         'timetable.utils.FeatureFlowView')
        self.assertUrlResolvesToView('/find_friends/',
         'timetable.utils.FeatureFlowView')
        self.assertUrlResolvesToView('/callback/google_calendar/',
         'timetable.utils.FeatureFlowView')

        # redirects
        self.assertUrlResolvesToView('/timetable/random_stuff', 'timetable.views.redirect_to_home')
        self.assertUrlResolvesToView('/timetable/', 'timetable.views.redirect_to_home')

        # timetables
        self.assertUrlResolvesToView('/timetables/', 'timetable.views.TimetableView')

        # timetable sharing
        self.assertUrlResolvesToView('/timetables/links/', 'timetable.views.TimetableLinkView')
        self.assertUrlResolvesToView('/timetables/links/SecAV/', 'timetable.views.TimetableLinkView')
        # old timetable sharing format
        self.assertUrlResolvesToView('/share/dIcMED', 'timetable.views.TimetableLinkView')


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

        response = self.client.post('/timetables/', request_data, format='json', **self.request_headers)
        self.assertEqual(response.status_code, 200)

        self.assertEqual(len(response.data['new_c_to_s']), 2)
        self.assertEqual(len(response.data['timetables']), 7)


class TimetableLinkViewTest(APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def setUp(self):
        sem = Semester.objects.create(name='Fall', year='2000')
        course = Course.objects.create(id=1, school='uoft', code='SEM101', name='Intro')
        section = Section.objects.create(course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')

    def test_create_then_get_link(self):
        data = {
            'timetable': {
                'courses': [
                    {'id': 1, 'enrolled_sections': ['L1']}
                ],
                'has_conflict': False
            },
            'semester': {'name': 'Fall', 'year': '2000'}
        }
        response = self.client.post('/timetables/links/', data, format='json', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('slug', response.data)

        slug = response.data['slug']

        # assumes that the response will be a 404 if post did not actually create a shared timetable
        response = self.client.get('/timetables/links/{}/'.format(slug), **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
