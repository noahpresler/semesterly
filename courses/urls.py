from django.conf.urls import patterns, url
from django.contrib import admin

import courses.views

admin.autodiscover()

urlpatterns = patterns('',
                       # old endpoints:
                       url(r'c/(?P<code>.+?)$', courses.views.course_page),
                       url(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$',
                           courses.views.CourseModal.as_view()),
                       url((r'^course_classmates/(?P<school>.+?)/(?P<sem_name>.+)/'
                           r'(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)/*$'),
                           courses.views.get_classmates_in_course),
                       url(r'^courses/?$', courses.views.all_courses),

                       # course info
                       url(r'^courses/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)/?$',
                           courses.views.CourseDetail.as_view()),
                       # school info
                       url(r'^school/(?P<school>.+?)/?$', courses.views.SchoolList.as_view())
                       )
