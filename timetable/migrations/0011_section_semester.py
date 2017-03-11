# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-02-24 21:09
from __future__ import unicode_literals
from operator import attrgetter

from django.db import migrations, models
import django.db.models.deletion

from update_semester_field import update_sem_fields


def update_section_semesters(apps, schema_editor):
    tables_to_update = [apps.get_model('timetable', 'Section')]
    for table in tables_to_update:
        update_sem_fields(table, get_school=attrgetter('course.school'),
                            sem_table=apps.get_model('timetable', 'Semester'))


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0010_auto_20170224_1553'),
    ]

    operations = [
        migrations.AddField(
            model_name='section',
            name='semester',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='timetable.Semester'),
            preserve_default=False,
        ),
        migrations.RunPython(update_section_semesters),
    ]
