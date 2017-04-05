from django.conf.urls import patterns, url
from django.contrib import admin

import analytics.views
import student.views


admin.autodiscover()

urlpatterns = patterns('',
    url(r'^analytics/*$', analytics.views.view_analytics_dashboard),
    url(r'^robots.txt*$', analytics.views.view_analytics_dashboard),
    url(r'^user/log_fb_alert_click/*$', analytics.views.log_facebook_alert_click),
    url(r'^user/log_fb_alert_view/*$', analytics.views.log_facebook_alert_view),
    url(r'^user/log_ical/*$', student.views.log_ical_export),
)