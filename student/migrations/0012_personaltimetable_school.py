# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0011_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='personaltimetable',
            name='school',
            field=models.CharField(default='uoft', max_length=50),
            preserve_default=False,
        ),
    ]
