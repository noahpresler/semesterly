from django.conf.urls import patterns, url
from django.contrib import admin

import timetable.views


admin.autodiscover()

urlpatterns = patterns('',
    url(r'^get_final_exams/*$', timetable.views.final_exam_scheduler),
    url(r'^final_exams/*$', timetable.views.view_final_exams),
)
