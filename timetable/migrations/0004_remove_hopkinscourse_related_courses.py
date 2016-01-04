# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0003_hopkinscourseevaluation'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='related_courses',
        ),
    ]
