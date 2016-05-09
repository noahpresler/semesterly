# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0009_auto_20160508_2306'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='social_courses',
            field=models.NullBooleanField(),
        ),
        migrations.AlterField(
            model_name='student',
            name='social_offerings',
            field=models.NullBooleanField(),
        ),
    ]
