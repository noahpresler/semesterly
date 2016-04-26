# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0007_auto_20160312_1154'),
    ]

    operations = [
        migrations.AlterField(
            model_name='courseoffering',
            name='instructors',
            field=models.CharField(default=b'TBA', max_length=500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='instructors',
            field=models.CharField(default=b'TBA', max_length=500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='ottawacourseoffering',
            name='instructors',
            field=models.CharField(default=b'TBA', max_length=500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='umdcourseoffering',
            name='instructors',
            field=models.CharField(default=b'TBA', max_length=500),
            preserve_default=True,
        ),
    ]
