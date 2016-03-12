# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0006_auto_20160309_1328'),
    ]

    operations = [
        migrations.CreateModel(
            name='Updates',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('school', models.CharField(max_length=100)),
                ('update_field', models.CharField(max_length=100)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('reason', models.CharField(default=b'Scheduled Update', max_length=200)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterField(
            model_name='textbook',
            name='isbn',
            field=models.BigIntegerField(serialize=False, primary_key=True),
            preserve_default=True,
        ),
    ]
