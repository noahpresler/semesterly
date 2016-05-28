# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0003_auto_20160519_1920'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='student',
            name='class_year',
        ),
        migrations.AddField(
            model_name='student',
            name='class_year',
            field=models.IntegerField(blank=True,null=True),
        ),
    ]
