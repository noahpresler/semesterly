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
from django.contrib.auth.views import LogoutView

from helpers.mixins import FeatureFlowView
import student.views

admin.autodiscover()

urlpatterns = [
    # profile management
    url(r'^user/logout/$', LogoutView.as_view(next_page='/')),
    url(r'^unsubscribe/(?P<id>[\w.@+-]+)/(?P<token>[\w.:\-_=]+)/$',
        student.views.unsubscribe),
    url(r'^user/settings/$', student.views.UserView.as_view()),
    url(
        r'^delete_account/$',
        FeatureFlowView.as_view(
            feature_name='DELETE_ACCOUNT', allow_unauthenticated=False)),

    # timetable management
    url(r'^user/timetables/$', student.views.UserTimetableView.as_view()),
    url(r'^user/timetables/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/$',
        student.views.UserTimetableView.as_view()),
    url(r'^user/timetables/(?P<sem_name>.+)/(?P<year>[0-9]{4})/(?P<tt_name>.+)/$',
        student.views.UserTimetableView.as_view()),
    # social
    url(r'^user/classmates/(?P<sem_name>.+)/(?P<year>[0-9]{4})',
        student.views.ClassmateView.as_view()),
    # url(r'^user/gcal/?$', student.views.GCalView.as_view()),
    url(r'^user/reactions/?$', student.views.ReactionView.as_view()),

    # for accepting TOS.
    url(r'^tos/accept/', student.views.accept_tos),
]
