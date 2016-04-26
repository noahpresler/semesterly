# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0011_auto_20160326_1859'),
    ]

    operations = [
        migrations.AlterField(
            model_name='courseoffering',
            name='meeting_section',
            field=models.CharField(max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='meeting_section',
            field=models.CharField(max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='ottawacourseoffering',
            name='meeting_section',
            field=models.CharField(max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='rutgerscourseoffering',
            name='meeting_section',
            field=models.CharField(max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='umdcourseoffering',
            name='meeting_section',
            field=models.CharField(max_length=50),
            preserve_default=True,
        ),
    ]
