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
from django.http import HttpResponseRedirect
from django.views.generic.base import RedirectView

# from rest_framework_simplejwt import views as jwt_views

import advising.views
from helpers.mixins import FeatureFlowView

app_name = 'advising'

urlpatterns = [
        #url(r'advising/$', advising.views.index),

        url('advising/$',FeatureFlowView.as_view(feature_name='ADVISING')),
        # NEED TO MODIFY THIS BELOW
        # path('api/token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
        # path('api/token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
    ]
