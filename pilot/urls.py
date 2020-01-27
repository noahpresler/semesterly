
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views
import pilot.views as view
from django.conf.urls import patterns, include, url
from rest_framework_swagger.views import get_swagger_view
from rest_framework.schemas import get_schema_view

import helpers.mixins
import semesterly.views

app_name = 'pilot'
urlpatterns = patterns('',
                       url(r'studentinfo/(?P<id>[0-9])/$', view.student_info, name='studentinfo'),
                       url(r'courses/(?P<id>[0-9])/$', view.courses, name='courses'),
                       url(r'pilot/(?P<id>[0-9])/$', view.index, name='home'),
                       url(r'info/(?P<id>[0-9])/$', view.info, name='info'),
                       url(r'courses/(?P<id>[0-9])/meetings/(?P<courseList>[\w\-]+)/$', view.meetings, name='meetings'),
                       url(r'courses/(?P<id>[0-9])/offerings/(?P<sectionList>[\w\-]+)/$', view.offerings,
                           name='offerings'),
                       url(r'^$', helpers.mixins.FeatureFlowView.as_view(), name='semlyhome'),
                       )
