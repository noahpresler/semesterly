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

from django.db import models


class Agreement(models.Model):
    """ Database object representing updates to the ToS/privacy policy. """
    # time of the update
    last_updated = models.DateTimeField()
    # short description of what the change is
    description = models.CharField(max_length=200, blank=True, default='')
    # url to the announcement page, if any. should be a local path (e.g. /notice)
    url = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        get_latest_by = "last_updated"
