from django.conf.urls import patterns, url
from django.contrib import admin

import integrations.views

admin.autodiscover()

urlpatterns = patterns('',
                       url(r'^integration/get/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/',
                           integrations.views.get_integration),
                       url(r'^integration/del/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/',
                           integrations.views.delete_integration),
                       url(r'^integration/add/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/',
                           integrations.views.add_integration),

                       url(r'^integrations/$',
                           integrations.views.IntegrationsView.as_view()),
                       url(r'^integrations/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/$',
                           integrations.views.IntegrationsView.as_view())
                       )
