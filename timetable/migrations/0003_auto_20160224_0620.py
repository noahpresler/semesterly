# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0002_auto_20160224_0620'),
    ]

    operations = [
        migrations.CreateModel(
            name='HopkinsLink',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_required', models.BooleanField(default=False)),
                ('courseoffering', models.ForeignKey(to='timetable.HopkinsCourseOffering')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Link',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_required', models.BooleanField(default=False)),
                ('courseoffering', models.ForeignKey(to='timetable.CourseOffering')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Textbook',
            fields=[
                ('isbn', models.BigIntegerField(max_length=13, serialize=False, primary_key=True)),
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
            model_name='link',
            name='textbook',
            field=models.ForeignKey(to='timetable.Textbook'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='hopkinslink',
            name='textbook',
            field=models.ForeignKey(to='timetable.Textbook'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='courseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.Textbook', through='timetable.Link'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='hopkinscourseoffering',
            name='textbooks',
            field=models.ManyToManyField(to='timetable.Textbook', through='timetable.HopkinsLink'),
            preserve_default=True,
        ),
    ]
