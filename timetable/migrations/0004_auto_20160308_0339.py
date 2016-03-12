# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0003_auto_20160224_0620'),
    ]

    operations = [
        migrations.CreateModel(
            name='OttawaCourse',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=250)),
                ('description', models.TextField(default=b'', max_length=1500)),
                ('unstopped_description', models.TextField(default=b'', max_length=1500)),
                ('campus', models.TextField(default=b'', max_length=300)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
                ('related_courses', models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.OttawaCourse', blank=True)),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='OttawaCourseEvaluation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('score', models.FloatField(default=5.0)),
                ('summary', models.TextField(max_length=1500)),
                ('professor', models.CharField(max_length=250)),
                ('course_code', models.CharField(max_length=20)),
                ('year', models.CharField(max_length=200)),
                ('course', models.ForeignKey(to='timetable.OttawaCourse')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='OttawaCourseOffering',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('meeting_section', models.CharField(max_length=20)),
                ('instructors', models.CharField(default=b'TBA', max_length=100)),
                ('day', models.CharField(max_length=1)),
                ('time_start', models.CharField(max_length=15)),
                ('time_end', models.CharField(max_length=15)),
                ('location', models.CharField(default=b'TBA', max_length=200)),
                ('size', models.IntegerField(default=-1)),
                ('enrolment', models.IntegerField(default=-1)),
                ('section_type', models.CharField(default=b'L', max_length=5)),
                ('course', models.ForeignKey(to='timetable.OttawaCourse')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='OttawaLink',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_required', models.BooleanField(default=False)),
                ('courseoffering', models.ForeignKey(to='timetable.OttawaCourseOffering')),
                ('textbook', models.ForeignKey(to='timetable.Textbook')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UmdCourse',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('code', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=250)),
                ('description', models.TextField(default=b'', max_length=1500)),
                ('unstopped_description', models.TextField(default=b'', max_length=1500)),
                ('campus', models.TextField(default=b'', max_length=300)),
                ('prerequisites', models.TextField(default=b'', max_length=1000)),
                ('exclusions', models.TextField(default=b'', max_length=1000)),
                ('related_courses', models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.UmdCourse', blank=True)),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UmdCourseEvaluation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('score', models.FloatField(default=5.0)),
                ('summary', models.TextField(max_length=1500)),
                ('professor', models.CharField(max_length=250)),
                ('course_code', models.CharField(max_length=20)),
                ('year', models.CharField(max_length=200)),
                ('course', models.ForeignKey(to='timetable.UmdCourse')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UmdCourseOffering',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('meeting_section', models.CharField(max_length=20)),
                ('instructors', models.CharField(default=b'TBA', max_length=100)),
                ('day', models.CharField(max_length=1)),
                ('time_start', models.CharField(max_length=15)),
                ('time_end', models.CharField(max_length=15)),
                ('location', models.CharField(default=b'TBA', max_length=200)),
                ('size', models.IntegerField(default=-1)),
                ('enrolment', models.IntegerField(default=-1)),
                ('section_type', models.CharField(default=b'L', max_length=5)),
                ('course', models.ForeignKey(to='timetable.UmdCourse')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UmdLink',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_required', models.BooleanField(default=False)),
                ('courseoffering', models.ForeignKey(to='timetable.UmdCourseOffering')),
                ('textbook', models.ForeignKey(to='timetable.Textbook')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='umdcourseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.Textbook', through='timetable.UmdLink'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='ottawacourseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.Textbook', through='timetable.OttawaLink'),
            preserve_default=True,
        ),
    ]
