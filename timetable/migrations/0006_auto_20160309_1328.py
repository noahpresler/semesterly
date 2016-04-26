# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0005_auto_20160309_1159'),
    ]

    operations = [
        migrations.AlterField(
            model_name='umdcourse',
            name='cores',
            field=models.CharField(default=b'', max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='umdcourse',
            name='geneds',
            field=models.CharField(default=b'', max_length=50),
            preserve_default=True,
        ),
    ]
