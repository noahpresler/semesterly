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

# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-03-12 00:24



from __future__ import absolute_import
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0010_calendarexport'),
    ]

    operations = [
        migrations.RenameField(
            model_name='analyticscoursesearch',
            old_name='semester',
            new_name='_semester',
        ),
        migrations.RenameField(
            model_name='analyticstimetable',
            old_name='semester',
            new_name='_semester',
        ),
        migrations.RenameField(
            model_name='sharedtimetable',
            old_name='semester',
            new_name='_semester',
        ),
    ]
