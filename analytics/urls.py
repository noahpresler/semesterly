from django.conf.urls import include, patterns, url
from django.contrib import admin

import analytics.views
import student.views

from dashing.utils import router
from analytics.widgets import *


router.register(NumberTimetablesWidget, 'number_timetables_widget')
router.register(NumberCalendarExportsWidget, 'number_calendar_exports_widget')
router.register(NumberFinalExamViewsWidget, 'number_final_exam_views_widget')
router.register(NumberSignupsWidget, 'number_signups_widget')
router.register(NumberFacebookAlertsViewsWidget, 'number_facebook_alerts_views_widget')
router.register(NumberFacebookAlertsClicksWidget, 'number_facebook_alerts_clicks_widget')
router.register(SignupsPerDayWidget, 'signups_per_day_widget')

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^analytics/*$', analytics.views.view_analytics_dashboard),
    url(r'^robots.txt*$', analytics.views.view_analytics_dashboard),
    url(r'^user/log_fb_alert_click/*$', analytics.views.log_facebook_alert_click),
    url(r'^user/log_fb_alert_view/*$', analytics.views.log_facebook_alert_view),
    url(r'^user/log_ical/*$', student.views.log_ical_export),

    url(r'^dashboard/custom_widgets/(?P<widget_name>.*)', analytics.views.get_widget),

    # dashboard
    url(r'^dashboard/', include(router.urls), name='dashboard'),
)
