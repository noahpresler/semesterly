# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0018_hopkinscourse_num_credits'),
    ]

    operations = [
        migrations.AddField(
            model_name='hopkinscourse',
            name='areas',
            field=models.CharField(default=b'', max_length=20),
        ),
    ]
