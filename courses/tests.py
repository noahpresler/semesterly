from datetime import datetime
from django.test import TestCase

from test_utils.test_cases import UrlTestCase
from timetable.models import Semester, Course, Section, Offering, Updates


class CourseDetail(TestCase):
    school = 'uoft'
    search_endpoint = 'search'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def setUp(self):
        self.sem_name = 'Winter'
        self.year = '1995'
        self.cid = 1
        self.name = 'Intro'
        self.code = 'SEM101'
        sem = Semester.objects.create(name=self.sem_name, year=self.year)
        course = Course.objects.create(id=self.cid, school=self.school, code=self.code, name=self.name)
        section = Section.objects.create(course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')

    def test_course_exists(self):
        response =  self.client.get('/api/courses/{}/{}/id/{}'.format(self.sem_name, self.year, self.cid),
                                    **self.request_headers)
        self.assertEqual(response.status_code, 200)

        course_info = response.json()
        self.assertEqual(course_info['name'], self.name)
        self.assertEqual(course_info['code'], self.code)

    def test_no_course_exists(self):
        response = self.client.get('/api/courses/{}/{}/id/{}'.format(self.sem_name, self.year, self.cid + 1),
                                   **self.request_headers)
        self.assertEqual(response.status_code, 404)


class SchoolListTest(TestCase):
    school = 'uoft'
    search_endpoint = 'search'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def setUp(self):
        self.areas = 'area'
        self.departments = 'math'
        self.level = 'hard'
        self.time = datetime.now()
        Course.objects.create(school=self.school, code='SEA101', name='Intro',
                              areas=self.areas, department=self.departments, level=self.level)
        Updates.objects.create(school=self.school, update_field='Course', last_updated=self.time)

    def test_school_exists(self):
        response =  self.client.get('/api/school_info/', **self.request_headers)
        self.assertEqual(response.status_code, 200)

        school_info = response.json()
        self.assertNotEqual(len(school_info['areas']), 0)
        self.assertNotEqual(len(school_info['departments']), 0)
        self.assertNotEqual(len(school_info['levels']), 0)
        self.assertIsNotNone(school_info['last_updated'])

    def test_school_does_not_exist(self):
        response = self.client.get('/api/school_info/', HTTP_HOST='jhu.sem.ly:8000')
        self.assertEqual(response.status_code, 200)

        school_info = response.json()
        self.assertEqual(len(school_info['areas']), 0)
        self.assertEqual(len(school_info['departments']), 0)
        self.assertEqual(len(school_info['levels']), 0)
        self.assertIsNone(school_info['last_updated'])


class UrlsTest(UrlTestCase):
    """ Test courses/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/courses/uoft/code/cs1234', 'courses.views.get_course_id')
        self.assertUrlResolvesToView('/courses/uoft/Fall/2020/id/38510', 'courses.views.get_course')
        self.assertUrlResolvesToView('/course_classmates/jhu/Spring/2018/id/9932', 'courses.views.get_classmates_in_course')
        self.assertUrlResolvesToView('/c/somecode0350!', 'courses.views.course_page')
        self.assertUrlResolvesToView('/course/music101/Summer/2021', 'timetable.views.view_timetable')
        self.assertUrlResolvesToView('/courses', 'courses.views.all_courses')
        self.assertUrlResolvesToView('/school_info/semuni', 'courses.views.school_info')

        self.assertUrlResolvesToView('/api/courses/Fall/2019/id/82', 'courses.views.CourseDetail')
        self.assertUrlResolvesToView('/api/school_info/', 'courses.views.SchoolList')
