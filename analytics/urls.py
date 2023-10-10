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

import analytics.views
import student.views


urlpatterns = [
    re_path(r"^analytics/*$", analytics.views.view_analytics_dashboard),
    re_path(r"^robots.txt*$", analytics.views.view_analytics_dashboard),
    re_path(r"^user/log_ical/*$", student.views.log_ical_export),
    re_path(r"^ui-error-logs/*$", analytics.views.UIErrorLogCreateView.as_view()),
]
