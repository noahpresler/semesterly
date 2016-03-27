# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0010_auto_20160326_1846'),
    ]

    operations = [
        migrations.AlterField(
            model_name='courseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='hopkinscourseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='ottawacourseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='rutgerscourseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=50),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='umdcourseoffering',
            name='section_type',
            field=models.CharField(default=b'L', max_length=50),
            preserve_default=True,
        ),
    ]
