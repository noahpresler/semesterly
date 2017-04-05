from django.conf.urls import patterns, url
from django.contrib import admin

import timetable.views


admin.autodiscover()

urlpatterns = patterns('',
    url(r'^search/(?P<school>.+?)/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/(?P<query>.+?)/', timetable.views.course_search),
    url(r'^advanced_search/', timetable.views.advanced_course_search),
)
