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

from django.conf.urls import include, re_path
from django.contrib import admin

import authpipe.views


admin.autodiscover()

urlpatterns = [
    # auth
    re_path('', include('social_django.urls', namespace='social')),
    re_path('', include(('django.contrib.auth.urls', 'auth'), namespace='auth')),

    # device token registration
    re_path(r'^registration-token/$',
        authpipe.views.RegistrationTokenView.as_view()),
    re_path(r'^registration-token/(?P<endpoint>.+?)/',
        authpipe.views.RegistrationTokenView.as_view())
]
