# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0008_auto_20160322_0441'),
    ]

    operations = [
        migrations.CreateModel(
            name='RutgersCourse',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=250)),
                ('description', models.TextField(default=b'', max_length=1500)),
                ('unstopped_description', models.TextField(default=b'', max_length=1500)),
                ('campus', models.TextField(default=b'', max_length=300)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
                ('related_courses', models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.RutgersCourse', blank=True)),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='RutgersCourseEvaluation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('score', models.FloatField(default=5.0)),
                ('summary', models.TextField(max_length=1500)),
                ('professor', models.CharField(max_length=250)),
                ('course_code', models.CharField(max_length=20)),
                ('year', models.CharField(max_length=200)),
                ('course', models.ForeignKey(to='timetable.RutgersCourse')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='RutgersCourseOffering',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('meeting_section', models.CharField(max_length=20)),
                ('instructors', models.CharField(default=b'TBA', max_length=500)),
                ('day', models.CharField(max_length=1)),
                ('time_start', models.CharField(max_length=15)),
                ('time_end', models.CharField(max_length=15)),
                ('location', models.CharField(default=b'TBA', max_length=200)),
                ('size', models.IntegerField(default=-1)),
                ('enrolment', models.IntegerField(default=-1)),
                ('waitlist', models.IntegerField(default=0)),
                ('section_type', models.CharField(default=b'L', max_length=5)),
                ('course', models.ForeignKey(to='timetable.RutgersCourse')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='RutgersLink',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_required', models.BooleanField(default=False)),
                ('courseoffering', models.ForeignKey(to='timetable.RutgersCourseOffering')),
                ('textbook', models.ForeignKey(to='timetable.Textbook')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='rutgerscourseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.Textbook', through='timetable.RutgersLink'),
            preserve_default=True,
        ),
    ]
