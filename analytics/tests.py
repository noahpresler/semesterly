"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

from helpers.test.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test analytics/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/analytics/', 'analytics.views.view_analytics_dashboard')
        self.assertUrlResolvesToView('/robots.txt', 'analytics.views.view_analytics_dashboard')
        self.assertUrlResolvesToView('/user/log_fb_alert_click/', 'analytics.views.log_facebook_alert_click')
        self.assertUrlResolvesToView('/user/log_fb_alert_view/', 'analytics.views.log_facebook_alert_view')
        self.assertUrlResolvesToView('/user/log_ical/', 'student.views.log_ical_export')
