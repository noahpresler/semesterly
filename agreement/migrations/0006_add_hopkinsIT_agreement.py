"""
Copyright (C) 2017 Semester.ly Technologies, LLC
Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

from __future__ import unicode_literals

from django.db import migrations
from agreement.models import Agreement
import datetime


def add_hopkinsIT_agreement(apps, schema_editor):

    agreement, created = Agreement.objects.get_or_create(
        url="\\notice",
        last_updated="2019-03-08 05:58:01.704254",
        description="We are now partnering with the Johns Hopkins IT department",
    )
    agreement.save()


class Migration(migrations.Migration):

    dependencies = [
        ("agreement", "0005_auto_20190121_1152"),
    ]

    operations = [migrations.RunPython(add_hopkinsIT_agreement)]
