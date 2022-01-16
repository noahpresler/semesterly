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
from timetable.models import *
from django.db.models import Q
from django.forms.models import model_to_dict
from .mailer import Mailer

if len(sys.argv) < 4:
    print("Please specify a school, a term (e.g. Fall), and a year (e.g. 2017).")
    exit(0)
school = sys.argv[1]
term = sys.argv[2]
year = int(sys.argv[3])

semester = Semester.objects.filter(name=term, year=year)
client = Mailer()

students = PersonalTimetable.objects.filter(school=school, semester=semester).values_list("student", flat=True).distinct()

for student_id in students:
    student = Student.objects.get(id=student_id)

    if not student.emails_enabled or not student.user.email:
        continue

    tt = student.personaltimetable_set.filter(semester=semester).order_by('last_updated').last()
    textbook_json = [{
                        "textbooks": [model_to_dict(Textbook.objects.get(isbn=t)) for t in tt.sections.filter(~Q(textbooks=None), course=c).values_list("textbooks", flat=True).distinct()],
                        "course_name": c.name,
                        "course_code": c.code,
                    } for c in tt.courses.all()]

    # Go through textbooks. If all empty lists (no textbooks), go to next student.
    have_textbooks = False
    for dic in textbook_json:
        if dic["textbooks"]:
            have_textbooks = True
            break

    if not have_textbooks:
        continue

    client.send_mail(student, "Happy First Day of Classes - Textbooks from Semester.ly", "email_textbooks.html", {'textbooks_json': textbook_json})
client.cleanup()
