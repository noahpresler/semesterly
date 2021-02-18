# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2019-01-21 16:52
from __future__ import unicode_literals

from __future__ import absolute_import
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agreement', '0004_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='agreement',
            name='description',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='agreement',
            name='url',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
    ]
