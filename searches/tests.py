from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test search/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/search/jhu/Intermission/2019/opencv/', 'searches.views.course_search')
        self.assertUrlResolvesToView('/advanced_search/', 'searches.views.advanced_course_search')
