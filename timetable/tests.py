import json

from django.test import TestCase

from timetable.test_utils import get_default_tt_request


class RegressionTests(TestCase):
    fixtures = ['uoft_fall_sample.json']
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:800'
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
