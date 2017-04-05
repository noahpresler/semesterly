from test.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test analytics/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/analytics/', 'analytics.views.view_analytics_dashboard')
        self.assertUrlResolvesToView('/robots.txt', 'analytics.views.view_analytics_dashboard')
        self.assertUrlResolvesToView('/user/log_fb_alert_click/', 'analytics.views.log_facebook_alert_click')
        self.assertUrlResolvesToView('/user/log_fb_alert_view/', 'analytics.views.log_facebook_alert_view')
        self.assertUrlResolvesToView('/user/log_ical/', 'student.views.log_ical_export')
