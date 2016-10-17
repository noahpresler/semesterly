import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from timetable.models import *
from scripts.amazon_helpers import *

courses = Course.objects.filter(school="uoft")
for course in courses:
  for section in Section.objects.filter(course=course):
    links = TextbookLink.objects.filter(section=section)
    links.delete()
