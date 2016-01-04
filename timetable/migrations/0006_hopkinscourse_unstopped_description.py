# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0005_hopkinscourse_related_courses'),
    ]

    operations = [
        migrations.AddField(
            model_name='hopkinscourse',
            name='unstopped_description',
            field=models.TextField(default='', max_length=1500),
            preserve_default=False,
        ),
    ]
