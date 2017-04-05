from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test courses/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/courses/uoft/code/cs1234', 'timetable.views.get_course_id')
        self.assertUrlResolvesToView('/courses/uoft/Fall/2020/id/38510', 'timetable.views.get_course')
        self.assertUrlResolvesToView('/course_classmates/jhu/Spring/2018/id/9932', 'timetable.views.get_classmates_in_course')
        self.assertUrlResolvesToView('/c/somecode0350!', 'timetable.views.course_page')
        self.assertUrlResolvesToView('/course/music101/Summer/2021', 'timetable.views.view_timetable')
        self.assertUrlResolvesToView('/courses', 'timetable.views.all_courses')
        self.assertUrlResolvesToView('/school_info/semuni', 'timetable.views.school_info')
