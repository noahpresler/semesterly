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

import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from timetable.models import *
from scripts.amazon_helpers import *

courses = Course.objects.filter(school="uoft")
for course in courses:
  for section in Section.objects.filter(course=course):
    links = TextbookLink.objects.filter(section=section)
    links.delete()
