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

from django.test import SimpleTestCase
from django.urls import resolve


class UrlTestCase(SimpleTestCase):

    def assertUrlResolvesToView(self, url, view_name, kwargs=None):
        resolved = resolve(url)
        self.assertEqual(resolved.view_name, view_name)
        if kwargs is not None:
            self.assertDictEqual(resolved.kwargs, kwargs)
