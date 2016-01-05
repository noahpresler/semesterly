# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0006_hopkinscourse_unstopped_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='related_courses',
            field=models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.Course', blank=True),
        ),
        migrations.AddField(
            model_name='course',
            name='unstopped_description',
            field=models.TextField(default='', max_length=1500),
            preserve_default=False,
        ),
    ]
