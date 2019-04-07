
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
from timetable.models import Course, Section, Semester


def add_pilot_sections_s19(apps, schema_editor):
    """ PILOT classes with respective # of sections for Spring 2019 """
    pilot_sections = [
        ["AS.110.106", 5],
        ["AS.110.107", 2]
    ]

    for code in pilot_sections:
        if Course.objects.filter(school="jhu",code=code[0]).exists():
                course = Course.objects.filter(school="jhu",code=code[0])
                s19 = Semester.objects.get(year="2019", name="Spring")

                for i in range(1, code[1] + 1): #[1, 2, 3, 4, 5]
                    section, created = Section.objects.get_or_create(course=course[0],meeting_section=("(P" + str(i) + ")"), size=30, section_type="P", semester=s19)
                    print(created)
                    print(section)
                    section.save()



class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0026_add_pilot_s19'),
    ]

    operations = [
        migrations.RunPython(add_pilot_sections_s19)
    ]