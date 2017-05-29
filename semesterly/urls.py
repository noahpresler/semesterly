from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin
from django.views.generic import TemplateView
from rest_framework_swagger.views import get_swagger_view
from rest_framework.schemas import get_schema_view

import helpers.mixins
import semesterly.views
import timetable.utils


admin.autodiscover()

urlpatterns = patterns('',
                       url(r'^$', helpers.mixins.FeatureFlowView.as_view(), name='home'),
                       url(r'about/*', TemplateView.as_view(template_name='about.html')),
                       url(r'press/*', TemplateView.as_view(template_name='press.html')),
                       url('', include('authpipe.urls')),
                       url('', include('timetable.urls')),
                       url('', include('courses.urls')),
                       url('', include('integrations.urls')),
                       url('', include('exams.urls')),
                       url('', include('searches.urls')),
                       url('', include('student.urls')),
                       url('', include('analytics.urls')),

                       # Automatic deployment endpoint
                       url(r'deploy_staging/', 'semesterly.views.deploy_staging'),

                       url(r'^sw(.*.js)$', semesterly.views.sw_js, name='sw_js'),
                       url(r'^manifest(.*.json)$', semesterly.views.manifest_json, name='manifest_json'),

                       # profiling
                       url(r'^silk/', include('silk.urls', namespace='silk')),

                       # error page testing
                       url(r'^404testing/', TemplateView.as_view(template_name='404.html')),
                       url(r'^500testing/', TemplateView.as_view(template_name='500.html'))
                       )

if getattr(settings, 'STAGING', False):
    urlpatterns += patterns('', url(r'^robots.txt$',
                                    lambda r: HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain")))
else:
    urlpatterns += patterns('', url(r'^robots.txt$',
                                    lambda r: HttpResponse("User-agent: *\nDisallow:", content_type="text/plain")))

# api views
if getattr(settings, 'DEBUG', True):
    urlpatterns += [
        url(r'^swagger/$', get_swagger_view(title='semesterly')),
        url(r'^schema/$', get_schema_view(title='semesterly')),
    ]