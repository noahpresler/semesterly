import json

from django.test import TestCase, SimpleTestCase
from django.core.urlresolvers import resolve

from timetable.test_utils import get_default_tt_request


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


class UrlTestCase(SimpleTestCase):
    """ Test timetable/urls.py """

    def test_urls_call_correct_views(self):
        # marketing urls
        self.assertEqual('timetable.views.launch_user_acq_modal', resolve('/signup/').view_name)
        self.assertEqual('timetable.views.view_textbooks', resolve('/textbooks/').view_name)
        self.assertEqual('timetable.views.export_calendar', resolve('/export_calendar/').view_name)
        self.assertEqual('timetable.views.enable_notifs', resolve('/notifyme/').view_name),
        self.assertEqual('timetable.views.find_friends', resolve('/find_friends/').view_name),
        self.assertEqual('student.views.react_to_course', resolve('/react/').view_name),

        # redirects
        self.assertEqual('timetable.views.redirect_to_home', resolve('/timetable/random_stuff').view_name)
        self.assertEqual('timetable.views.redirect_to_home', resolve('/timetable/').view_name)

        # course pages
        self.assertEqual('timetable.views.get_course_id', resolve('/courses/uoft/code/cs1234').view_name)
        self.assertEqual('timetable.views.get_course', resolve('/courses/uoft/Fall/2020/id/38510').view_name)
        self.assertEqual('timetable.views.get_classmates_in_course', resolve('/course_classmates/jhu/Spring/2018/id/9932').view_name)
        self.assertEqual('timetable.views.course_page', resolve('/c/somecode0350!').view_name)
        self.assertEqual('timetable.views.view_timetable', resolve('/course/music101/Summer/2021').view_name)
        self.assertEqual('timetable.views.all_courses', resolve('/courses').view_name)
        self.assertEqual('timetable.views.school_info', resolve('/school_info/semuni').view_name)

        # timetables
        self.assertEqual('timetable.views.get_timetables', resolve('/get_timetables/').view_name)

        # search
        self.assertEqual('timetable.views.course_search', resolve('/search/jhu/Intermission/2019/opencv/').view_name)
        self.assertEqual('timetable.views.advanced_course_search', resolve('/advanced_search/').view_name)

        # timetable sharing
        self.assertEqual('timetable.views.create_share_link', resolve('/share/link').view_name)
        self.assertEqual('timetable.views.share_timetable', resolve('/share/dIcMED').view_name)

        # integration
        self.assertEqual('timetable.views.get_integration', resolve('/integration/get/3DCe3/course/csc148/').view_name)
        self.assertEqual('timetable.views.delete_integration', resolve('/integration/del/39Ced/course/SD3910/').view_name)
        self.assertEqual('timetable.views.add_integration', resolve('/integration/add/139051/course/eng101/').view_name)


