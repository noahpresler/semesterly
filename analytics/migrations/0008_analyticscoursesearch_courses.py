# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-05 19:31
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0004_auto_20160520_1141'),
        ('analytics', '0007_analyticscoursesearch_is_advanced'),
    ]

    operations = [
        migrations.AddField(
            model_name='analyticscoursesearch',
            name='courses',
            field=models.ManyToManyField(to='timetable.Course'),
        ),
    ]
