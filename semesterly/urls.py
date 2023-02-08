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
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin
from django.views.generic import TemplateView

import helpers.mixins
import semesterly.views

urlpatterns = [
    re_path(r"^$", helpers.mixins.FeatureFlowView.as_view(), name="home"),
    re_path(r"about/?", TemplateView.as_view(template_name="about.html")),
    re_path(r"press/?", TemplateView.as_view(template_name="press.html")),
    re_path(r"notice/?", TemplateView.as_view(template_name="notice.html")),
    re_path("", include("authpipe.urls")),
    re_path("", include("timetable.urls")),
    re_path("", include("courses.urls")),
    re_path("", include("searches.urls")),
    re_path("", include("student.urls")),
    re_path("", include("analytics.urls")),
    re_path("", include("agreement.urls")),
    re_path("", include("notifications.urls")),
    re_path(r"admin/?", admin.site.urls),
    # Automatic deployment endpoint
    re_path(r"deploy_staging/?", semesterly.views.deploy_staging),
    re_path(
        r"^manifest(.*.json)$", semesterly.views.manifest_json, name="manifest_json"
    ),
    # error page testing
    re_path(r"^404testing/?", TemplateView.as_view(template_name="404.html")),
    re_path(r"^500testing/?", TemplateView.as_view(template_name="500.html")),
    re_path(
        r"^maintenance_testing/?",
        TemplateView.as_view(template_name="maintenance.html"),
    ),
]

if getattr(settings, "STAGING", False):
    urlpatterns += [
        re_path(
            r"^robots.txt$",
            lambda r: HttpResponse(
                "User-agent: *\nDisallow: /", content_type="text/plain"
            ),
        )
    ]
else:
    urlpatterns += [
        re_path(
            r"^robots.txt$",
            lambda r: HttpResponse(
                "User-agent: *\nDisallow:", content_type="text/plain"
            ),
        )
    ]

# api views
if getattr(settings, "DEBUG", True):
    from rest_framework import permissions
    from drf_yasg.views import get_schema_view
    from drf_yasg import openapi

    schema_view = get_schema_view(
        openapi.Info(
            title="Semester.ly Debug API",
            default_version="v1",
        ),
        public=True,
        permission_classes=[permissions.AllowAny],
    )
    urlpatterns += [
        re_path(
            r"^swagger/$",
            schema_view.with_ui("swagger", cache_timeout=0),
            name="schema-swagger-ui",
        ),
        re_path(r"^__debug__/", include("debug_toolbar.urls")),
    ]
