# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-04-08 02:30
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0014_migrate_uoft_y_courses'),
    ]

    operations = [
        migrations.CreateModel(
            name='TermOfService',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_updated', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
