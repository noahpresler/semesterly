# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-05-09 03:32
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0007_personaltimetable_student'),
    ]

    operations = [
        migrations.AddField(
            model_name='personaltimetable',
            name='name',
            field=models.CharField(default='', max_length=100),
            preserve_default=False,
        ),
    ]
