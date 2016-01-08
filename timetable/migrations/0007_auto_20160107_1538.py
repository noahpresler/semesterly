# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0006_auto_20160107_1538'),
    ]

    operations = [
        migrations.CreateModel(
            name='HopkinsTextbook',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('isbn', models.CharField(max_length=13)),
                ('is_required', models.BooleanField(default=False)),
                ('detail_url', models.URLField(max_length=1000)),
                ('image_url', models.URLField(max_length=1000)),
                ('author', models.CharField(max_length=500)),
                ('title', models.CharField(max_length=1500)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='hopkinscourseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.HopkinsTextbook'),
            preserve_default=True,
        ),
    ]
