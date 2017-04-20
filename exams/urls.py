from django.conf.urls import patterns, url
from django.contrib import admin

import exams.views


admin.autodiscover()

urlpatterns = patterns('',
                       url(r'^get_final_exams/*$', exams.views.final_exam_scheduler),
                       url(r'^final_exams/*$', exams.views.view_final_exams),

                       url(r'^final-exams/', exams.views.ExamView.as_view())
                       )
