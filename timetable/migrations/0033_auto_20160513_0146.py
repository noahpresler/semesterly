# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0032_auto_20160512_0338'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='course',
            name='related_courses',
        ),
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='areas',
        ),
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='num_credits',
        ),
        migrations.RemoveField(
            model_name='hopkinscourse',
            name='related_courses',
        ),
        migrations.RemoveField(
            model_name='ottawacourse',
            name='related_courses',
        ),
        migrations.RemoveField(
            model_name='queenscourse',
            name='num_credits',
        ),
        migrations.RemoveField(
            model_name='queenscourse',
            name='related_courses',
        ),
        migrations.RemoveField(
            model_name='rutgerscourse',
            name='num_credits',
        ),
        migrations.RemoveField(
            model_name='rutgerscourse',
            name='related_courses',
        ),
        migrations.RemoveField(
            model_name='umdcourse',
            name='num_credits',
        ),
        migrations.RemoveField(
            model_name='umdcourse',
            name='related_courses',
        ),
        migrations.AddField(
            model_name='basecourse',
            name='areas',
            field=models.CharField(default=b'', max_length=300, null=True),
        ),
        migrations.AddField(
            model_name='basecourse',
            name='department',
            field=models.CharField(default=b'', max_length=250, null=True),
        ),
        migrations.AddField(
            model_name='basecourse',
            name='num_credits',
            field=models.FloatField(default=-1),
        ),
        migrations.AddField(
            model_name='basecourse',
            name='related_courses',
            field=models.ManyToManyField(related_name='related_courses_rel_+', to='timetable.BaseCourse', blank=True),
        ),
    ]
