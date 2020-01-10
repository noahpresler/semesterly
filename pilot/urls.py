from django.conf.urls import patterns, url, include
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views
import pilot.views as view

app_name = 'pilot'
urlpatterns = patterns('',
                       url(r'studentinfo/(?P<id>[0-9])/$', view.student_info, name='studentinfo'),
                       url(r'courses/(?P<id>[0-9])/$', view.courses, name='courses'),
                       url(r'pilot/(?P<id>[0-9])/$', view.index, name='home'),
                       url(r'info/(?P<id>[0-9])/$', view.info, name='info'),
                       url(r'courses/(?P<id>[0-9])/meetings/(?P<courseList>[\w\-]+)/$', view.meetings, name='meetings'),
                       url(r'courses/(?P<id>[0-9])/offerings/(?P<sectionList>[\w\-]+)/$', view.offerings,
                           name='offerings'),
                       )


