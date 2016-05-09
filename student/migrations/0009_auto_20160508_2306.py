# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0008_auto_20160508_2237'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='social_courses',
            field=models.BooleanField(),
        ),
        migrations.AlterField(
            model_name='student',
            name='social_offerings',
            field=models.BooleanField(),
        ),
    ]
