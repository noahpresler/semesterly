# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-02-24 20:53
from __future__ import unicode_literals

from django.db import migrations, models


def create_new_semesters(apps, schema_editor):
    Semester = apps.get_model('timetable', 'Semester')
    new_rows = [
        Semester.objects.get_or_create(name='Full Year', year='2016'),
        Semester.objects.get_or_create(name='Fall', year='2016'),
        Semester.objects.get_or_create(name='Spring', year='2017'),
        Semester.objects.get_or_create(name='Winter', year='2017'),
    ]
    print "Created {0} new terms".format(sum(is_new for (_, is_new) in new_rows))


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0009_auto_20170221_1452'),
    ]

    operations = [
        migrations.CreateModel(
            name='Semester',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('year', models.CharField(max_length=4)),
            ],
        ),
        migrations.RenameField(
            model_name='section',
            old_name='semester',
            new_name='_semester',
        ),
        migrations.RunPython(create_new_semesters),
    ]
