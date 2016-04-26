# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0002_student_fbook_uid'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='class_year',
            field=models.CharField(default=b'FR', max_length=2, choices=[(b'FR', b'Freshman'), (b'SO', b'Sophomore'), (b'JR', b'Junior'), (b'SR', b'Senior')]),
        ),
        migrations.AddField(
            model_name='student',
            name='major',
            field=models.CharField(default=b'', max_length=255),
        ),
        migrations.AddField(
            model_name='student',
            name='social_courses',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='student',
            name='social_offerings',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='student',
            name='fbook_uid',
            field=models.CharField(default=b'', max_length=255),
        ),
    ]
