# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from django.conf.urls import include, re_path
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin
from django.views.generic import TemplateView
from rest_framework_swagger.views import get_swagger_view
from rest_framework.schemas import get_schema_view

import helpers.mixins
import semesterly.views
import timetable.utils
import pilot.urls


admin.autodiscover()

urlpatterns = [
    re_path(r'^$', helpers.mixins.FeatureFlowView.as_view(), name='home'),
    re_path(r'about/*', TemplateView.as_view(template_name='about.html')),
    re_path(r'press/*', TemplateView.as_view(template_name='press.html')),
    re_path(r'notice', TemplateView.as_view(
        template_name='notice.html')),
    re_path('', include('authpipe.urls')),
    re_path('', include('timetable.urls')),
    re_path('', include('courses.urls')),
    re_path('', include('integrations.urls')),
    re_path('', include('exams.urls')),
    re_path('', include('searches.urls')),
    re_path('', include('student.urls')),
    re_path('', include('analytics.urls')),
    re_path('', include('agreement.urls')),
    re_path('', include('pilot.urls')),
    re_path(r'admin/*', admin.site.urls),

    # Automatic deployment endpoint
    re_path(r'deploy_staging/', semesterly.views.deploy_staging),

    re_path(r'^sw(.*.js)$', semesterly.views.sw_js, name='sw_js'),
    re_path(r'^manifest(.*.json)$',
        semesterly.views.manifest_json, name='manifest_json'),


    # error page testing
    re_path(r'^404testing/',
        TemplateView.as_view(template_name='404.html')),
    re_path(r'^500testing/',
        TemplateView.as_view(template_name='500.html')),
    re_path(r'^maintenance_testing/',
        TemplateView.as_view(template_name='maintenance.html'))
]

if getattr(settings, 'STAGING', False):
    urlpatterns += [re_path(r'^robots.txt$',
                        lambda r: HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain"))]
else:
    urlpatterns += [re_path(r'^robots.txt$',
                        lambda r: HttpResponse("User-agent: *\nDisallow:", content_type="text/plain"))]

# api views
if getattr(settings, 'DEBUG', True):
    urlpatterns += [
        re_path(r'^swagger/$', get_swagger_view(title='semesterly')),
        re_path(r'^schema/$', get_schema_view(title='semesterly')),
    ]
