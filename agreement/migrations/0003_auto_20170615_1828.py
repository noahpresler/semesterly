# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2017-06-15 23:28



from __future__ import absolute_import
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('agreement', '0002_auto_20170520_1927'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='agreement',
            options={'get_latest_by': 'last_updated'},
        ),
    ]
