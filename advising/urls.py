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

import advising.views
from helpers.mixins import FeatureFlowView

admin.autodiscover()

urlpatterns = [
    url(r'^advising/*$', advising.views.AdvisingView.as_view()),
    url(r'^advising/jhu_signup/*$',
        FeatureFlowView.as_view(feature_name='JHU_SIGNUP', is_advising=True)),
    url(r'^advising/sis_post/$', advising.views.StudentSISView.as_view()),

    # Get the semesters that the student with this JHED has imported from SIS
    url(r'^advising/sis_semesters/(?P<jhed>.+)/$',
        advising.views.StudentSISView.as_view()),

    # Get the courses for the student with this JHED and verify it against this student's timetable
    url(r'^advising/sis_courses/(?P<sem_name>.+)/(?P<year>[0-9]{4})/(?P<jhed>.+)/(?P<tt_name>.+)/$',
        advising.views.RegisteredCoursesView.as_view()),
    # Get the courses for the student with this JHED
    url(r'^advising/sis_courses/(?P<sem_name>.+)/(?P<year>[0-9]{4})/(?P<jhed>.+)/$',
        advising.views.RegisteredCoursesView.as_view()),
]
