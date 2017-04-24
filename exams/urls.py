from django.conf.urls import patterns, url
from django.contrib import admin

import exams.views


admin.autodiscover()

urlpatterns = patterns('',
   url(r'^get_final_exams/*$', exams.views.final_exam_scheduler),
   url(r'^final_exams/*$', exams.views.view_final_exams),
   url(r'share/(?P<ref>.+)/*$', exams.views.view_final_exam_share),
   url(r'share_link/*$', exams.views.share_final_exam_schedule),
)
