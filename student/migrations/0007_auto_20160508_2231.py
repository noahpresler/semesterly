# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0006_auto_20160508_2155'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='class_year',
            field=models.CharField(blank=True, max_length=2, choices=[(b'FR', b'Freshman'), (b'SO', b'Sophomore'), (b'JR', b'Junior'), (b'SR', b'Senior')]),
        ),
    ]
