# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0028_auto_20160508_2155'),
        ('student', '0012_personaltimetable_school'),
    ]

    operations = [
        migrations.AddField(
            model_name='hopkinspersonaltimetable',
            name='courses',
            field=models.ManyToManyField(to='timetable.HopkinsCourse'),
        ),
        migrations.AddField(
            model_name='rutgerspersonaltimetable',
            name='courses',
            field=models.ManyToManyField(to='timetable.RutgersCourse'),
        ),
        migrations.AddField(
            model_name='umdpersonaltimetable',
            name='courses',
            field=models.ManyToManyField(to='timetable.UmdCourse'),
        ),
        migrations.AddField(
            model_name='uoftpersonaltimetable',
            name='courses',
            field=models.ManyToManyField(to='timetable.Course'),
        ),
    ]
