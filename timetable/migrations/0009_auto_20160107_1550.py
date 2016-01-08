# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0008_auto_20160107_1550'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='related_courses',
            field=models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.Course', blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='hopkinscourse',
            name='related_courses',
            field=models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.HopkinsCourse', blank=True),
            preserve_default=True,
        ),
    ]
