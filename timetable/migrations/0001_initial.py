# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=250)),
                ('description', models.TextField(max_length=1500)),
                ('campus', models.IntegerField()),
                ('breadths', models.CharField(default=b'', max_length=5)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='CourseOffering',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('meeting_section', models.CharField(max_length=20)),
                ('instructors', models.CharField(max_length=100)),
                ('day', models.CharField(max_length=1)),
                ('time_start', models.CharField(max_length=15)),
                ('time_end', models.CharField(max_length=15)),
                ('location', models.CharField(max_length=50)),
                ('size', models.IntegerField(default=0)),
                ('enrolment', models.IntegerField(default=0)),
                ('alternates', models.BooleanField(default=False)),
                ('course', models.ForeignKey(to='timetable.Course')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='HopkinsCourse',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=250)),
                ('description', models.TextField(max_length=1500)),
                ('campus', models.IntegerField()),
                ('breadths', models.CharField(default=b'', max_length=5)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='HopkinsCourseOffering',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('meeting_section', models.CharField(max_length=20)),
                ('instructors', models.CharField(max_length=100)),
                ('day', models.CharField(max_length=1)),
                ('time_start', models.CharField(max_length=15)),
                ('time_end', models.CharField(max_length=15)),
                ('location', models.CharField(max_length=50)),
                ('size', models.IntegerField(default=0)),
                ('enrolment', models.IntegerField(default=0)),
                ('alternates', models.BooleanField(default=False)),
                ('evaluation_score', models.FloatField(default=0)),
                ('course', models.ForeignKey(to='timetable.HopkinsCourse')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
