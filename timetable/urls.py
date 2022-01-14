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
from django.http import HttpResponseRedirect
from django.views.generic.base import RedirectView

import timetable.views
from helpers.mixins import FeatureFlowView

admin.autodiscover()

urlpatterns = [
    re_path(r'^signin/*$',
        FeatureFlowView.as_view(feature_name='USER_ACQ')),
    re_path(r'^signup/*$',
        FeatureFlowView.as_view(feature_name='SIGNUP')),
    re_path(r'^textbooks/*$',
        FeatureFlowView.as_view(feature_name='VIEW_TEXTBOOKS')),
    re_path(r'^export_calendar/*$',
        FeatureFlowView.as_view(feature_name='EXPORT_CALENDAR')),
    re_path(r'^notifyme/*$',
        FeatureFlowView.as_view(feature_name='ENABLE_NOTIFS')),
    re_path(r'^find_friends/$',
        FeatureFlowView.as_view(feature_name='FIND_FRIENDS')),
    # re_path(r'^callback/google_calendar/*$', FeatureFlowView.as_view(feature_name='GCAL_CALLBACK')),

    re_path(r'^timetable/.*$', RedirectView.as_view(url="/")),

    re_path(r'^complete/facebook/.*$', FeatureFlowView.as_view()),

    # timetables
    re_path(r'^timetables/?$',
        timetable.views.TimetableView.as_view()),

    # sharing
    re_path(r'^timetables/links/$',
        timetable.views.TimetableLinkView.as_view()),
    re_path(r'^timetables/links/(?P<slug>.+)/$',
        timetable.views.TimetableLinkView.as_view()),

    # maintain backwards compatibility TODO: change to
    # redirect
    re_path(r'share/(?P<slug>.+)/$',
        lambda request, slug:
        HttpResponseRedirect('/timetables/links/{0}/'.format(slug)))
]
