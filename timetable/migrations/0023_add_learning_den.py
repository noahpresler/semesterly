"""
Copyright (C) 2017 Semester.ly Technologies, LLC
Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

from __future__ import unicode_literals

from django.db import migrations
from timetable.models import Integration, CourseIntegration, Course


def add_learning_den(apps, schema_editor):
  """ Learning Den classes for Spring 2018 """
  learning_den_codes = [
    "AS.020.152",
    "AS.020.306",
    "AS.030.102",
    "AS.030.103",
    "AS.030.206",
    "AS.050.203",
    "AS.080.203",
    "AS.080.306",
    "AS.110.106",
    "AS.110.107",
    "AS.110.109",
    "AS.110.302",
    "AS.171.101",
    "AS.171.102",
    "AS.171.104",
    "AS.171.108",
    "AS.180.102",
    "AS.180.242",
    "AS.180.302",
    "AS.180.334",
    "AS.210.102",
    "AS.210.111",
    "AS.200.101",
    "AS.200.141",
    "AS.210.112",
    "AS.210.202",
    "AS.210.211",
    "AS.210.212",
    "AS.210.301",
    "AS.210.302",
    "AS.210.311",
    "AS.210.312",
    "AS.280.350",
    "AS.375.116",
    "AS.375.216",
    "EN.510.312",
    "EN.510.314",
    "EN.530.105",
    "EN.540.202",
    "EN.540.203",
    "EN.540.303",
    "EN.553.111",
    "EN.553.112",
    "EN.553.171",
    "EN.553.211",
    "EN.553.310",
    "EN.580.222",
    "EN.580.223",
    "EN.540.422",
    "EN.601.107",
    "EN.660.203",
    ]

  integration, created = Integration.objects.get_or_create(name="LearningDen")
  integration.save()

  for code in learning_den_codes:
    if Course.objects.filter(school="jhu",code=code).exists():
        course = Course.objects.filter(school="jhu",code=code)
        courseIntegration, created = CourseIntegration.objects.get_or_create(course=course[0],integration=integration,json='')
        courseIntegration.save()

class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0022_auto_20170821_1305'),
    ]

    operations = [
      migrations.RunPython(add_learning_den)
    ]
