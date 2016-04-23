# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0004_auto_20160308_0339'),
    ]

    operations = [
        migrations.AddField(
            model_name='courseoffering',
            name='waitlist',
            field=models.IntegerField(default=0),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='hopkinscourseoffering',
            name='waitlist',
            field=models.IntegerField(default=0),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='ottawacourseoffering',
            name='waitlist',
            field=models.IntegerField(default=0),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='umdcourse',
            name='cores',
            field=models.CharField(default=b'', max_length=20),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='umdcourse',
            name='geneds',
            field=models.CharField(default=b'', max_length=20),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='umdcourse',
            name='num_credits',
            field=models.IntegerField(default=-1),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='umdcourseoffering',
            name='waitlist',
            field=models.IntegerField(default=0),
            preserve_default=True,
        ),
    ]
