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

import django, os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import *
from timetable.models import *
from .mailer import Mailer

if len(sys.argv) < 3:
    print("Please specify a school (e.g. jhu) and a semester (F or S).")
    exit(0)
school = sys.argv[1]
semester = Semester.objects.filter(name=sys.argv[2])

client = Mailer()
d = {}

sections = Section.objects.filter(course__school="jhu")
for section in sections:
    if not section.was_full and (section.size <= section.enrolment):
        section.was_full = True
        section.save()
        try:
            timetables = PersonalTimetable.objects.filter(sections__id__contains=section.id, semester=semester)
        except:
            print(("Problem with getting section with id = " + str(section.id)))
        for student, timetable in zip([t.student for t in timetables], timetables):
            if timetable != student.personaltimetable_set.filter(semester=semester).order_by('last_updated').last():
                # Only applies for the student's last modified schedule.
                continue
            # NOTIFIY STUDENT
            if student not in d:
                d[student] = []
            d[student].append(section)

    elif section.was_full and section.enrolment < section.size:
        section.was_full = False
        section.save()

for student, sections in list(d.items()):
    client.send_mail(student, "Course Waitlist Notification from Semester.ly", "email_waitlist.html", {'sections': sections})


client.cleanup()
