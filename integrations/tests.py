from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test integrations/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/integration/get/3DCe3/course/csc148/', 'timetable.views.get_integration')
        self.assertUrlResolvesToView('/integration/del/39Ced/course/SD3910/', 'timetable.views.delete_integration')
        self.assertUrlResolvesToView('/integration/add/139051/course/eng101/', 'timetable.views.add_integration')
