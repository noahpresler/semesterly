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

from django.conf.urls import url
from django.contrib import admin

import forum.views

admin.autodiscover()

urlpatterns = [
    url(r'^advising/forum/all/$', forum.views.ForumView.as_view()),
    url(r'^advising/forum/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/$',
        forum.views.ForumTranscriptView.as_view()),
]
