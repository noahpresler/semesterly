from django.test import TestCase

from timetable.models import Course, Section, Offering, Semester
from test_utils.test_cases import UrlTestCase


class BasicSearchTest(TestCase):
    school = 'uoft'
    search_endpoint = 'search'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def setUp(self):
        sem = Semester.objects.create(name='Winter', year='1995')
        course = Course.objects.create(school=self.school, code='SEA101', name='Intro')
        section = Section.objects.create(course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')

    def test_course_exists(self):
        response =  self.client.get('/api/{}/Winter/1995/sea/'.format(self.search_endpoint), **self.request_headers)
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(len(response.json()),  0)

    def test_no_course_exists(self):
        response = self.client.get('/api/{}/Fall/2016/sea/'.format(self.search_endpoint), **self.request_headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 0)


class AdvancedSearchTest(BasicSearchTest):
    search_endpoint = 'advanced_search'

    def setUp(self):
        super(AdvancedSearchTest, self).setUp()

    def test_filter_times(self):
        pass

    def test_filter_levels(self):
        pass

    def test_pagination(self):
        pass


class UrlsTest(UrlTestCase):
    """ Test search/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/search/jhu/Intermission/2019/opencv/', 'searches.views.course_search')
        self.assertUrlResolvesToView('/advanced_search/', 'searches.views.advanced_course_search')
