from django.conf.urls import patterns, url, include
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views
import pilot.views as view

app_name = 'pilot'
urlpatterns = patterns('',
                       url('studentinfo/(?P<id>[0-9])/', view.student_info, name='studentinfo'),
                       url('courses/(?P<id>[0-9])/', view.courses, name='courses'),
                       url('pilot/(?P<id>[0-9])/', view.index, name='home'),
                       url('info/(?P<id>[0-9])/', view.info, name='info'),
                       url('courses/(?P<id>[0-9])/offerings/', view.offerings, name='offerings'),
                       )


