from django.conf.urls import patterns, url
from django.contrib import admin

import exams.views
from helpers.mixins import FeatureFlowView

admin.autodiscover()

urlpatterns = patterns('',
                       url(r'^final_exams/*$', FeatureFlowView.as_view(feature_name='FINAL_EXAMS')),

                       url(r'^exams/?$', exams.views.ExamView.as_view()),
                       url(r'^exams/links/?$', exams.views.ExamLink.as_view()),
                       url(r'^exams/links/(?P<slug>.+)/$', exams.views.ExamLink.as_view())
                       )
