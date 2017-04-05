from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test exams/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/get_final_exams/', 'timetable.views.final_exam_scheduler')
        self.assertUrlResolvesToView('/final_exams/', 'timetable.views.view_final_exams')
