# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0012_auto_20160329_1639'),
    ]

    operations = [
        migrations.AddField(
            model_name='rutgerscourse',
            name='cores',
            field=models.CharField(default=b'', max_length=50),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='rutgerscourse',
            name='num_credits',
            field=models.FloatField(default=-1),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='rutgerscourseoffering',
            name='exam_code',
            field=models.CharField(default=b'', max_length=10),
            preserve_default=True,
        ),
    ]
