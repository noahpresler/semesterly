# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0021_auto_20160406_1807'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hopkinscourse',
            name='areas',
            field=models.CharField(default=b'', max_length=300),
        ),
    ]
