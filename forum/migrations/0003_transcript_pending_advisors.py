# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2021-04-16 01:48
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('advising', '0002_auto_20210414_0051'),
        ('forum', '0002_auto_20210401_1712'),
    ]

    operations = [
        migrations.AddField(
            model_name='transcript',
            name='pending_advisors',
            field=models.ManyToManyField(related_name='invited_transcripts', to='advising.Advisor'),
        ),
    ]
