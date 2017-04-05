from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
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
    url(r'react/*', student.views.react_to_course),
    url(r'^jhu/countdown/*$', timetable.views.jhu_timer),
    url(r'^callback/google_calendar/*$', timetable.views.google_calendar_callback),
    url(r'^user/log_final_exam/*$', timetable.views.log_final_exam_view),

    # timetable
        # redirects
    url(r'^timetable/*$', timetable.views.redirect_to_home),
    url(r'^timetable/.+$', timetable.views.redirect_to_home),
    url(r'^complete/facebook/.*$', timetable.views.view_timetable),
        # course pages
    url(r'^courses/(?P<school>.+?)/code/(?P<course_id>.+)/*$', timetable.views.get_course_id),
    url(r'^courses/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<id>[0-9]+)/*$',
        timetable.views.get_course),
    url(r'^course_classmates/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<id>[0-9]+)/*$',
        timetable.views.get_classmates_in_course),
    url(r'c/(?P<code>.+?)$', timetable.views.course_page),
    url(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$', timetable.views.view_timetable),
    url(r'^school_info/(?P<school>.+?)', timetable.views.school_info),
    url(r'courses/*', timetable.views.all_courses),
        # timetables
    url(r'^get_timetables/$', timetable.views.get_timetables),
        # search
    url(r'^search/(?P<school>.+?)/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/(?P<query>.+?)/', timetable.views.course_search),
    url(r'^advanced_search/', timetable.views.advanced_course_search),
        # timetable sharing
    url(r'share/link/*$', timetable.views.create_share_link),
    url(r'share/(?P<ref>.+)/*$', timetable.views.share_timetable),
        # Integration
    url(r'^integration/get/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/',
        timetable.views.get_integration),
    url(r'^integration/del/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/',
        timetable.views.delete_integration),
    url(r'^integration/add/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/',
        timetable.views.add_integration),
        # final exam scheduler
    url(r'^get_final_exams/*$', timetable.views.final_exam_scheduler),
    url(r'^final_exams/*$', timetable.views.view_final_exams),
)
