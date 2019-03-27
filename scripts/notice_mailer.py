# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import django, os, json
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import *
from scripts import jhu_smtp_mailer

school = 'jhu'
client = jhu_smtp_mailer.JHUSMTPMailer() # TODO: Use AWS Mailer in prod

# JHU EMAIL
############
students = PersonalTimetable.objects.filter(school=school).values_list("student", flat=True).distinct()
for student_id in students:
    student = Student.objects.get(id=student_id)
    client.send_mail(student, "Exciting news from Semester.ly!", "email_notice.html", {'data': None})
client.cleanup()

# NON-JHU EMAIL
################
students = PersonalTimetable.objects.exclude(school=school).values_list("student", flat=True).distinct()
for student_id in students:
    student = Student.objects.get(id=student_id)
    client.send_mail(student, "Update from Semester.ly!", "email_nonjhu_notice.html", {'data': None})
client.cleanup()
