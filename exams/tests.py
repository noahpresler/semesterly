from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test exams/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/final_exams/',
          'timetable.utils.FeatureFlowView')

        self.assertUrlResolvesToView('/exams/', 'exams.views.ExamView')
