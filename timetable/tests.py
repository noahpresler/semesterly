import json

from django.test import TestCase

from test_utils.utils import get_default_tt_request
from test_utils.test_cases import UrlTestCase


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


class UrlsTest(UrlTestCase):
    """ Test timetable/urls.py """

    def test_urls_call_correct_views(self):
        # marketing urls
        self.assertUrlResolvesToView('/signup/', 'timetable.views.launch_user_acq_modal')
        self.assertUrlResolvesToView('/textbooks/', 'timetable.views.view_textbooks')
        self.assertUrlResolvesToView('/export_calendar/', 'timetable.views.export_calendar')
        self.assertUrlResolvesToView('/notifyme/', 'timetable.views.enable_notifs'),
        self.assertUrlResolvesToView('/find_friends/', 'timetable.views.find_friends'),
        self.assertUrlResolvesToView('/react/', 'student.views.react_to_course'),

        # redirects
        self.assertUrlResolvesToView('/timetable/random_stuff', 'timetable.views.redirect_to_home')
        self.assertUrlResolvesToView('/timetable/', 'timetable.views.redirect_to_home')

        # timetables
        self.assertUrlResolvesToView('/get_timetables/', 'timetable.views.get_timetables')

        # timetable sharing
        self.assertUrlResolvesToView('/share/link', 'timetable.views.create_share_link')
        self.assertUrlResolvesToView('/share/dIcMED', 'timetable.views.share_timetable')
