# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-06-15 23:35
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0017_remove_sharedtimetable_name'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='analyticscoursesearch',
            name='_semester',
        ),
        migrations.RemoveField(
            model_name='analyticstimetable',
            name='_semester',
        ),
        migrations.RemoveField(
            model_name='sharedtimetable',
            name='_semester',
        ),
    ]
