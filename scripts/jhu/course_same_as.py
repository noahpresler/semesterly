import django, os, json, traceback, sys, smtplib
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import Course

old_codes = ["EN.550.", "EN.600."]
new_codes = ["EN.553.", "EN.601."]

for old_code, new_code in zip(old_codes, new_codes):
    new_courses = Course.objects.filter(code__contains=new_code)
    for new_course in new_courses:
        code = new_course.code[-3:]
        old_courses = Course.objects.filter(code__contains=old_code + code)
        if old_courses.exists():
            new_course.same_as = old_courses[0]
            new_course.save()
