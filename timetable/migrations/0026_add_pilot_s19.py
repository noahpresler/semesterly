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
from timetable.models import Integration, CourseIntegration, Course, Semester


def add_pilot_s19(apps, schema_editor):
    """ PILOT classes for Spring 2019"""
    pilot_codes = [
        "AS.110.106",
        "AS.110.107",
        "AS.110.109",
        "AS.110.202",
        "AS.110.201",
        "AS.110.302",
        "AS.553.171",
        "AS.500.112",
        "AS.553.111",
        "AS.553.112",
        "AS.280.350",
        "AS.030.102",
        "AS.030.206",
        "AS.180.102",
        "AS.171.101",
        "AS.171.102",
        "AS.171.104",
        "AS.171.108"
    ]

    integration, created = Integration.objects.get_or_create(name="PILOT")
    integration.save()

    if Semester.objects.filter(year="2019", name="Spring").exists():
        s19 = Semester.objects.get(year="2019", name="Spring")
        for code in pilot_codes:
            if Course.objects.filter(school="jhu",code=code).exists():
                course = Course.objects.filter(school="jhu",code=code)
                courseIntegration, created = CourseIntegration.objects.get_or_create(course=course[0],integration=integration,json='')
                if not created:
                    courseIntegration.save()
                courseIntegration.semester.add(s19)
                courseIntegration.save()

class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0024_courseintegration_semester'),
    ]

    operations = [
        migrations.RunPython(add_pilot_s19)
    ]