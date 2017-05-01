from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # auth
        self.assertUrlResolvesToView('/login/facebook/', 'social:begin', kwargs={'backend': 'facebook'})
        self.assertUrlResolvesToView('/complete/facebook/', 'social:complete', kwargs={'backend': 'facebook'})

        # registration
        self.assertUrlResolvesToView('/setRegistrationToken/', 'authpipe.views.set_registration_token')
        self.assertUrlResolvesToView('/deleteRegistrationToken/', 'authpipe.views.delete_registration_token')
