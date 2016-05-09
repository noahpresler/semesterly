# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0005_hopkinspersonaltimetable_rutgerspersonaltimetable_umdpersonaltimetable_uoftpersonaltimetable'),
    ]

    operations = [
        migrations.CreateModel(
            name='PersonalTimetable',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('semester', models.CharField(max_length=2)),
                ('time_updated', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='hopkinspersonaltimetable',
            name='id',
        ),
        migrations.RemoveField(
            model_name='hopkinspersonaltimetable',
            name='semester',
        ),
        migrations.RemoveField(
            model_name='hopkinspersonaltimetable',
            name='time_updated',
        ),
        migrations.RemoveField(
            model_name='rutgerspersonaltimetable',
            name='id',
        ),
        migrations.RemoveField(
            model_name='rutgerspersonaltimetable',
            name='semester',
        ),
        migrations.RemoveField(
            model_name='rutgerspersonaltimetable',
            name='time_updated',
        ),
        migrations.RemoveField(
            model_name='umdpersonaltimetable',
            name='id',
        ),
        migrations.RemoveField(
            model_name='umdpersonaltimetable',
            name='semester',
        ),
        migrations.RemoveField(
            model_name='umdpersonaltimetable',
            name='time_updated',
        ),
        migrations.RemoveField(
            model_name='uoftpersonaltimetable',
            name='id',
        ),
        migrations.RemoveField(
            model_name='uoftpersonaltimetable',
            name='semester',
        ),
        migrations.RemoveField(
            model_name='uoftpersonaltimetable',
            name='time_updated',
        ),
        migrations.AddField(
            model_name='hopkinspersonaltimetable',
            name='personaltimetable_ptr',
            field=models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, default=None, serialize=False, to='student.PersonalTimetable'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='rutgerspersonaltimetable',
            name='personaltimetable_ptr',
            field=models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, default=None, serialize=False, to='student.PersonalTimetable'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='umdpersonaltimetable',
            name='personaltimetable_ptr',
            field=models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, default=None, serialize=False, to='student.PersonalTimetable'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='uoftpersonaltimetable',
            name='personaltimetable_ptr',
            field=models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, default=None, serialize=False, to='student.PersonalTimetable'),
            preserve_default=False,
        ),
    ]
