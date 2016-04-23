# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='courseoffering',
            name='can_be_locked',
        ),
        migrations.RemoveField(
            model_name='courseoffering',
            name='textbooks',
        ),
        migrations.DeleteModel(
            name='Textbook',
        ),
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='breadths',
        ),
        migrations.RemoveField(
            model_name='hopkinscourseoffering',
            name='alternates',
        ),
        migrations.RemoveField(
            model_name='hopkinscourseoffering',
            name='can_be_locked',
        ),
        migrations.RemoveField(
            model_name='hopkinscourseoffering',
            name='evaluation_score',
        ),
        migrations.RemoveField(
            model_name='hopkinscourseoffering',
            name='textbooks',
        ),
        migrations.DeleteModel(
            name='HopkinsTextbook',
        ),
        migrations.AlterField(
            model_name='course',
            name='campus',
            field=models.TextField(default=b'', max_length=300),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='course',
            name='description',
            field=models.TextField(default=b'', max_length=1500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='course',
            name='unstopped_description',
            field=models.TextField(default=b'', max_length=1500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='courseoffering',
            name='enrolment',
            field=models.IntegerField(default=-1),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='courseoffering',
            name='instructors',
            field=models.CharField(default=b'TBA', max_length=100),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='courseoffering',
            name='location',
            field=models.CharField(default=b'TBA', max_length=200),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='courseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=5),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='courseoffering',
            name='size',
            field=models.IntegerField(default=-1),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourse',
            name='campus',
            field=models.TextField(default=b'', max_length=300),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourse',
            name='code',
            field=models.CharField(max_length=20),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourse',
            name='description',
            field=models.TextField(default=b'', max_length=1500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourse',
            name='unstopped_description',
            field=models.TextField(default=b'', max_length=1500),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='enrolment',
            field=models.IntegerField(default=-1),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='instructors',
            field=models.CharField(default=b'TBA', max_length=100),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='location',
            field=models.CharField(default=b'TBA', max_length=200),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='meeting_section',
            field=models.CharField(max_length=20),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=5),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='size',
            field=models.IntegerField(default=-1),
            preserve_default=True,
        ),
    ]
