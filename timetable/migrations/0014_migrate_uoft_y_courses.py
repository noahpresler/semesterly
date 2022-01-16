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



from django.db import migrations


def move_y_courses(apps, schema_editor):
  """ Replace every Y course with one F course and one Y course """
  Semester = apps.get_model('timetable', 'Semester')
  Section = apps.get_model('timetable', 'Section')

  fall_sem = Semester.objects.get(name='Fall', year='2016')
  winter_sem = Semester.objects.get(name='Winter', year='2017')
  num_y_courses = Section.objects.filter(_semester='Y').count()
  for section in Section.objects.filter(_semester='Y'):
    # change the Y section into F
    section.semester = fall_sem
    section.save()

    # create new S section by copying section and its offerings
    offerings = section.offering_set.all()
    section.semester = winter_sem
    section.pk = None
    section.save()
    for offering in offerings:
      offering.section = section
      offering.pk = None
      offering.save()


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0013_update_semester_field'),
    ]

    operations = [
      migrations.RunPython(move_y_courses)
    ]
