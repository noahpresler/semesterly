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


def add_learning_den(apps, schema_editor):
  """ Add Learning Den classes for Spring 2018 """
  Courses = apps.get_model('timetable', 'Course').objects.all()
  learning_den_courses = ["AS.020.152", "AS.020.306", "AS.030.102"]

  integration = Integration.objects.create(name="LearningDen")
  integration.save()

  for c in learning_den_courses:
    course = Courses.filter(code=c)
    courseIntegration = CourseIntegration.objects.create(course=course[0],integration=integration,json='')
    courseIntegration.save()

#      list of codes
#      for each code in list of codes
#        course = course.object.get(___)
        # assumes course in db, if not in db then pass
#        courseintegration.objects.create
#        course = course
#        integration = integration
#        .save()


class Migration(migrations.Migration):

    dependencies = [
        ('timetable', '0022_auto_20170821_1305'),
    ]

    operations = [
      migrations.RunPython(add_learning_den)
    ]