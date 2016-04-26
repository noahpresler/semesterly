# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0013_auto_20160401_0827'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rutgerscourse',
            name='cores',
            field=models.CharField(default=b'', max_length=100),
            preserve_default=True,
        ),
    ]
