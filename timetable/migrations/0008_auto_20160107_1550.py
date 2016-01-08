# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0007_auto_20160107_1538'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='course',
            name='related_courses',
        ),
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='related_courses',
        ),
    ]
