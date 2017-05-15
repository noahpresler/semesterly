import sys
import os

import json

import django
from student.models import PersonalTimetable
from timetable.models import Semester
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

def all_students_with_timetables(school, semester):
    return PersonalTimetable.objects.filter(school=school, semester=semester)\
            .values_list("student", flat=True).distinct()
