# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0007_auto_20160104_1545'),
    ]

    operations = [
        migrations.AddField(
            model_name='hopkinstextbook',
            name='Title',
            field=models.CharField(default='', max_length=1500),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='hopkinstextbook',
            name='author',
            field=models.CharField(default='', max_length=500),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='hopkinstextbook',
            name='detail_url',
            field=models.URLField(default='', max_length=1000),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='hopkinstextbook',
            name='image_url',
            field=models.URLField(default='', max_length=1000),
            preserve_default=False,
        ),
    ]
