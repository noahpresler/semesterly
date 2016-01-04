# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0002_auto_20160103_2253'),
    ]

    operations = [
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
    ]
