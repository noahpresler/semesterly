# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0005_auto_20160107_1538'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='hopkinscourseoffering',
            name='textbooks',
        ),
        migrations.DeleteModel(
            name='HopkinsTextbook',
        ),
    ]
