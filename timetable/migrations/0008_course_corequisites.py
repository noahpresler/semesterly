# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-10-20 20:51
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0007_auto_20161020_1505'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='corequisites',
            field=models.TextField(default=b'', null=True),
        ),
    ]
