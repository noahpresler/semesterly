# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0002_personaltimetable_has_conflict'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='friends',
            field=models.ManyToManyField(related_name='friends_rel_+', to='student.Student', blank=True),
        ),
    ]
