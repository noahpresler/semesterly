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

import searches.views


admin.autodiscover()


urlpatterns = [
    re_path(r'^search/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/(?P<query>.*?)/?$',
        searches.views.CourseSearchList.as_view()),
]
