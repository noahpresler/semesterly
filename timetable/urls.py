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

import timetable.views
from helpers.mixins import FeatureFlowView

admin.autodiscover()

urlpatterns = [
    url(r'^signin/*$',
        FeatureFlowView.as_view(feature_name='USER_ACQ')),
    url(r'^signup/*$',
        FeatureFlowView.as_view(feature_name='SIGNUP')),
    url(r'^textbooks/*$',
        FeatureFlowView.as_view(feature_name='VIEW_TEXTBOOKS')),
    url(r'^export_calendar/*$',
        FeatureFlowView.as_view(feature_name='EXPORT_CALENDAR')),
    url(r'^notifyme/*$',
        FeatureFlowView.as_view(feature_name='ENABLE_NOTIFS')),
    url(r'^find_friends/$',
        FeatureFlowView.as_view(feature_name='FIND_FRIENDS')),
    # url(r'^callback/google_calendar/*$', FeatureFlowView.as_view(feature_name='GCAL_CALLBACK')),

    url(r'^timetable/.*$', RedirectView.as_view(url="/")),

    url(r'^complete/facebook/.*$', FeatureFlowView.as_view()),

    # timetables
    url(r'^timetables/?$',
        timetable.views.TimetableView.as_view()),

    # sharing
    url(r'^timetables/links/$',
        timetable.views.TimetableLinkView.as_view()),
    url(r'^timetables/links/(?P<slug>.+)/$',
        timetable.views.TimetableLinkView.as_view()),

    # maintain backwards compatibility TODO: change to
    # redirect
    url(r'share/(?P<slug>.+)/$',
        lambda request, slug:
        HttpResponseRedirect('/timetables/links/{0}/'.format(slug)))
]
