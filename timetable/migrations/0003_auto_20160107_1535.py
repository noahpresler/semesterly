# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0002_auto_20160107_1534'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='unstopped_description',
            field=models.TextField(default='', max_length=1500),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='hopkinscourse',
            name='unstopped_description',
            field=models.TextField(default='', max_length=1500),
            preserve_default=False,
        ),
    ]
