
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views
import pilot.views as view
from django.conf.urls import include, re_path
from rest_framework_swagger.views import get_swagger_view
from rest_framework.schemas import get_schema_view

import helpers.mixins
import semesterly.views

app_name = 'pilot'
urlpatterns = [
    re_path(r'studentinfo/$', view.student_info, name='studentinfo'),
    re_path(r'pilotcourses/$', view.pilotcourses, name='pilotcourses'),
    re_path(r'pilot/$', view.index, name='home'),
    re_path(r'info/$', view.info, name='info'),
    re_path(r'pilotcourses/meetings/(?P<courseList>[\w\-]+)/$',
        view.meetings, name='meetings'),
    re_path(r'pilotcourses/offerings/(?P<sectionList>[\w\-]+)/$', view.offerings,
        name='offerings'),
    re_path(r'^$', helpers.mixins.FeatureFlowView.as_view(), name='semlyhome'),
]
