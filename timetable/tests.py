import json
import random

from django.test import TestCase, SimpleTestCase
from django.core.urlresolvers import resolve

from timetable.test_utils import get_default_tt_request
from school_mappers import VALID_SCHOOLS


class RegressionTests(TestCase):
    fixtures = ['uoft_fall_sample.json']
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def test_course_search(self):
        response =  self.client.get('/search/uoft/Fall/2016/mu/', **self.request_headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['results']),  4)

    def test_advanced_course_search(self):
        pass

    def test_create_timetable(self):
        request_data = get_default_tt_request()
        request_data.update({
            'updated_courses': [
                {'course_id': 6090, 'section_codes': ['']},
                {'course_id': 6076, 'section_codes': ['']}
            ]})

        response = self.client.post('/get_timetables/', data=json.dumps(request_data), content_type='application/json', **self.request_headers)
        self.assertEqual(response.status_code, 200)

        response = json.loads(response.getvalue())
        self.assertEqual(len(response['new_c_to_s']), 2)
        self.assertEqual(len(response['timetables']), 7)

    def test_share_link(self):
        pass

    def test_course_info(self):
        pass


class EndPointSmokeTests(TestCase):
    """ Test that all defined endpoints return 200. """
    host = 'sem.ly:8000'

    def test_marketing_urls(self):
        marketing_urls = [
            '/signup/',
            '/textbooks',
            '/export_calendar/',
            '/notifyme/',
            '/find_friends/',
            '/react/',
            '/jhu/countdown/'
        ]
        for url in marketing_urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)

            # if it requires a subdomain, test that too
            view_handler = resolve(url)
            if view_handler.func.func_dict.get('requires_subdomain', False):
                subdomain = random.choice(VALID_SCHOOLS)
                response = self.client.get(url, HTTP_HOST='{}.{}'.format(subdomain, self.host))
                self.assertEqual(response.status_code, 200)

