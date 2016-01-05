# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0004_remove_hopkinscourse_related_courses'),
    ]

    operations = [
        migrations.AddField(
            model_name='hopkinscourse',
            name='related_courses',
            field=models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.HopkinsCourse', blank=True),
        ),
    ]
