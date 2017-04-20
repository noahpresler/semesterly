from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test exams/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/get_final_exams/', 'exams.views.final_exam_scheduler')
        self.assertUrlResolvesToView('/final_exams/', 'exams.views.view_final_exams')

        self.assertUrlResolvesToView('/final-exams/', 'exams.views.ExamView')
