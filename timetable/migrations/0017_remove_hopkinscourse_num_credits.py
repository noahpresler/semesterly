# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0016_hopkinscourse_num_credits'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='num_credits',
        ),
    ]
