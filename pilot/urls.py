from django.conf.urls import patterns, url
from django.contrib import admin

import pilot.views

app_name = 'pilot'
urlpatterns = patterns('', url('pilot/(?P<id>[0-9]{10})/', pilot.views.index, name='home'),
                       url('info/(?P<id>[0-9]{10})/', pilot.views.info, name='info'),
                       url('studentinfo/(?P<id>[0-9]{10})/', pilot.views.studentinfo, name='studentinfo')
                       )