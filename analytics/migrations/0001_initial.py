# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0012_auto_20160329_1639'),
    ]

    operations = [
        migrations.CreateModel(
            name='HopkinsSearchQuery',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('query', models.CharField(max_length=20)),
                ('cur_semester', models.CharField(max_length=2)),
                ('cur_campuses', models.CharField(max_length=10)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='HopkinsTimetable',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('num_generated', models.IntegerField(default=1)),
                ('is_conflict', models.NullBooleanField()),
                ('courses', models.ManyToManyField(to='timetable.HopkinsCourse')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='SearchQuery',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('query', models.CharField(max_length=20)),
                ('cur_semester', models.CharField(max_length=2)),
                ('cur_campuses', models.CharField(max_length=10)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('session_id', models.CharField(default=-1, max_length=30)),
                ('ip', models.CharField(max_length=20, null=True)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('lat_long', models.CharField(max_length=30, null=True)),
                ('city', models.CharField(max_length=30, null=True)),
                ('country', models.CharField(max_length=20, null=True)),
                ('end_time', models.DateTimeField(null=True, blank=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Timetable',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('num_generated', models.IntegerField(default=1)),
                ('is_conflict', models.NullBooleanField()),
                ('courses', models.ManyToManyField(to='timetable.Course')),
                ('session', models.ForeignKey(to='analytics.Session')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='searchquery',
            name='session',
            field=models.ForeignKey(to='analytics.Session'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='hopkinstimetable',
            name='session',
            field=models.ForeignKey(to='analytics.Session'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='hopkinssearchquery',
            name='session',
            field=models.ForeignKey(to='analytics.Session'),
            preserve_default=True,
        ),
    ]
