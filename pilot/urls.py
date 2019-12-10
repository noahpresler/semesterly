from django.conf.urls import patterns, url
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views
import pilot.views as view

app_name = 'pilot'
urlpatterns = patterns('',
                       url('studentinfo/(?P<id>[0-9]{10})/', view.student_info, name='studentinfo'),
                       url('pilot/(?P<id>[0-9]{10})/', view.index, name='home'),
                       url('info/(?P<id>[0-9]{10})/', view.info, name='info'),
                       )
