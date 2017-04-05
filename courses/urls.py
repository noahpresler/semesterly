from django.conf.urls import patterns, url
from django.contrib import admin

import timetable.views


admin.autodiscover()

urlpatterns = patterns('',
    url(r'^courses/(?P<school>.+?)/code/(?P<course_id>.+)/*$', timetable.views.get_course_id),
    url(r'^courses/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<id>[0-9]+)/*$',
        timetable.views.get_course),
    url(r'^course_classmates/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<id>[0-9]+)/*$',
        timetable.views.get_classmates_in_course),
    url(r'c/(?P<code>.+?)$', timetable.views.course_page),
    url(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$', timetable.views.view_timetable),
    url(r'^school_info/(?P<school>.+?)', timetable.views.school_info),
    url(r'courses/*', timetable.views.all_courses),
)
