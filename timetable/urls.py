from django.conf.urls import patterns, url
from django.contrib import admin

import student.views
import timetable.views

admin.autodiscover()

urlpatterns = patterns('',
                       # marketing urls
                       url(r'^signup/*', timetable.views.launch_user_acq_modal),
                       url(r'^textbooks/*$', timetable.views.view_textbooks),
                       url(r'^export_calendar/*$', timetable.views.export_calendar),
                       url(r'^notifyme/*$', timetable.views.enable_notifs),
                       url(r'^find_friends/$', timetable.views.find_friends),
                       url(r'^react/*', student.views.react_to_course),
                       url(r'^jhu/countdown/*$', timetable.views.jhu_timer),
                       url(r'^callback/google_calendar/*$', timetable.views.google_calendar_callback),
                       url(r'^user/log_final_exam/*$', timetable.views.log_final_exam_view),

                       # redirects
                       url(r'^timetable/*$', timetable.views.redirect_to_home),
                       url(r'^timetable/.+$', timetable.views.redirect_to_home),
                       url(r'^complete/facebook/.*$', timetable.views.view_timetable),

                       # timetables
                       url(r'^timetables/?$', timetable.views.TimetableView.as_view()),

                       # sharing
                       url(r'^timetables/links/$', timetable.views.TimetableLinkView.as_view()),
                       url(r'^timetables/links/(?P<slug>.+)/$', timetable.views.TimetableLinkView.as_view())
                       )
