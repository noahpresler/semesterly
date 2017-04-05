from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test integrations/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/integration/get/3DCe3/course/csc148/', 'integrations.views.get_integration')
        self.assertUrlResolvesToView('/integration/del/39Ced/course/SD3910/', 'integrations.views.delete_integration')
        self.assertUrlResolvesToView('/integration/add/139051/course/eng101/', 'integrations.views.add_integration')
