# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0008_auto_20160105_0038'),
    ]

    operations = [
        migrations.RenameField(
            model_name='hopkinstextbook',
            old_name='Title',
            new_name='title',
        ),
    ]
