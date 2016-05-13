# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0013_auto_20160509_1600'),
    ]

    operations = [
        migrations.AddField(
            model_name='personaltimetable',
            name='last_updated',
            field=models.DateTimeField(default=datetime.datetime(2016, 5, 13, 16, 17, 30, 724722, tzinfo=utc), auto_now=True),
            preserve_default=False,
        ),
    ]
