# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-09-26 23:22
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0004_auto_20160520_1141'),
    ]

    operations = [
        migrations.CreateModel(
            name='CourseIntegration',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('json', models.TextField()),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='timetable.Course')),
            ],
        ),
        migrations.CreateModel(
            name='Integration',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=250)),
            ],
        ),
        migrations.AddField(
            model_name='courseintegration',
            name='integration',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='timetable.Integration'),
        ),
    ]
