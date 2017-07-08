from django.conf.urls import patterns, url
from django.contrib import admin

import integrations.views

admin.autodiscover()

urlpatterns = patterns('',
                       url(r'^integrations/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/$',
                           integrations.views.IntegrationsView.as_view())
                       )
