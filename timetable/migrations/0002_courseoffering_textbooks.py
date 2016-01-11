# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='courseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.Textbook'),
        ),
    ]
