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
                ('unstopped_description', models.TextField(max_length=1500)),
                ('campus', models.IntegerField()),
                ('breadths', models.CharField(default=b'', max_length=5)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
                ('related_courses', models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.Course', blank=True)),
            ],
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
                ('location', models.CharField(max_length=200)),
                ('size', models.IntegerField(default=0)),
                ('enrolment', models.IntegerField(default=0)),
                ('alternates', models.BooleanField(default=False)),
                ('section_type', models.CharField(max_length=5)),
                ('can_be_locked', models.BooleanField(default=False)),
                ('course', models.ForeignKey(to='timetable.Course')),
            ],
        ),
        migrations.CreateModel(
            name='HopkinsCourse',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=25)),
                ('name', models.CharField(max_length=250)),
                ('description', models.TextField(max_length=1500)),
                ('unstopped_description', models.TextField(max_length=1500)),
                ('campus', models.IntegerField()),
                ('breadths', models.CharField(default=b'', max_length=5)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
                ('related_courses', models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.HopkinsCourse', blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='HopkinsCourseEvaluation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('score', models.FloatField(default=5.0)),
                ('summary', models.TextField(max_length=1500)),
                ('professor', models.CharField(max_length=250)),
                ('course_code', models.CharField(max_length=20)),
                ('year', models.CharField(max_length=200)),
                ('course', models.ForeignKey(to='timetable.HopkinsCourse')),
            ],
        ),
        migrations.CreateModel(
            name='HopkinsCourseOffering',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('meeting_section', models.CharField(max_length=25)),
                ('instructors', models.CharField(max_length=100)),
                ('day', models.CharField(max_length=1)),
                ('time_start', models.CharField(max_length=15)),
                ('time_end', models.CharField(max_length=15)),
                ('location', models.CharField(max_length=250)),
                ('size', models.IntegerField(default=0)),
                ('enrolment', models.IntegerField(default=0)),
                ('alternates', models.BooleanField(default=False)),
                ('evaluation_score', models.FloatField(default=0)),
                ('section_type', models.CharField(default=b'C', max_length=5)),
                ('can_be_locked', models.BooleanField(default=True)),
                ('course', models.ForeignKey(to='timetable.HopkinsCourse')),
            ],
        ),
        migrations.CreateModel(
            name='HopkinsTextbook',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('isbn', models.CharField(max_length=13)),
                ('is_required', models.BooleanField(default=False)),
                ('detail_url', models.URLField(max_length=1000)),
                ('image_url', models.URLField(max_length=1000)),
                ('author', models.CharField(max_length=500)),
                ('title', models.CharField(max_length=1500)),
            ],
        ),
        migrations.CreateModel(
            name='Textbook',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('isbn', models.CharField(max_length=13)),
                ('is_required', models.BooleanField(default=False)),
                ('detail_url', models.URLField(max_length=1000)),
                ('image_url', models.URLField(max_length=1000)),
                ('author', models.CharField(max_length=500)),
                ('title', models.CharField(max_length=1500)),
            ],
        ),
        migrations.AddField(
            model_name='hopkinscourseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.HopkinsTextbook'),
        ),
    ]
