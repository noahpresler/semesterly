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

from django.conf.urls import include, url
from django.contrib import admin

import authpipe.views
from helpers.mixins import FeatureFlowView


admin.autodiscover()

urlpatterns = [
    # auth
    url('', include('social_django.urls', namespace='social')),
    url('', include('django.contrib.auth.urls', namespace='auth')),

    # device token registration
    url(r'^registration-token/$',
        authpipe.views.RegistrationTokenView.as_view()),
    url(r'^registration-token/(?P<endpoint>.+?)/',
        authpipe.views.RegistrationTokenView.as_view()),
    
    # for separate accounts error
    url(r'^separate_accounts/$', FeatureFlowView.as_view(feature_name="SEPARATE_ACCOUNTS")),
]
