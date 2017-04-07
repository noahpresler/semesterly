from django.conf.urls import patterns, url
from django.contrib import admin

import courses.views
import timetable.views


admin.autodiscover()

urlpatterns = patterns('',
                       # course info
                       url(r'^courses/(?P<school>.+?)/code/(?P<course_id>.+)/*$', courses.views.get_course_id),  # ?
                       url(r'^courses/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)/*$',
                           courses.views.get_course),
                       url(r'c/(?P<code>.+?)$', courses.views.course_page),  # ?
                       url(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$', timetable.views.view_timetable),
                       url(r'^courses/*', courses.views.all_courses),  # ?
                       # school info
                       url(r'^school_info/(?P<school>.+?)', courses.views.school_info),
                       # classmates
                       url(r'^course_classmates/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)/*$',
                           courses.views.get_classmates_in_course),

                       # course info
                       url(r'^api/courses/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)$',
                           courses.views.CourseDetail.as_view()),
                       # school info
                       url(r'api/school_info/', courses.views.SchoolList.as_view())
                       )
