# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from django.conf.urls import re_path
from django.contrib import admin

import courses.views

admin.autodiscover()

urlpatterns = [
    # old endpoints:
    re_path(r'c/(?P<code>.+?)$', courses.views.course_page),
    re_path(r'^courses/?$', courses.views.all_courses),

    re_path(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$',
        courses.views.CourseModal.as_view()),
    re_path((r'^course_classmates/(?P<school>.+?)/(?P<sem_name>.+)/'
         r'(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)/*$'),
        courses.views.get_classmates_in_course),
    # course info
    re_path(r'^courses/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<course_id>[0-9]+)/?$',
        courses.views.CourseDetail.as_view()),
    # school info
    re_path(r'^school/(?P<school>.+?)/?$',
        courses.views.SchoolList.as_view())
]
