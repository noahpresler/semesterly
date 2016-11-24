import os, sys, django, pickle, progressbar
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from analytics.models import *
from student.models import *
from timetable.models import *

similarities = pickle.load(open("recommended.model", "rb"))

bar2 = progressbar.ProgressBar()
for cid in bar2(similarities.keys()):
    related = filter(lambda x: x[0] != cid,sorted(similarities[cid],key=lambda x: x[1], reverse=True)[:5])
    course = Course.objects.get(id=cid)
    Course.related_courses.through.objects.filter(from_course_id=cid).delete()
    Course.related_courses.through.objects.filter(to_course_id=cid).delete()
    for c in related:
        course.related_courses.add(Course.objects.get(id=c[0]))