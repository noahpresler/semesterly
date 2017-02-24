import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from timetable.models import Semester
from timetable.school_mappers import VALID_SCHOOLS


def create_new_semesters():
  new_rows = [
    Semester.objects.get_or_create(name='Full Year', year='2016'),
    Semester.objects.get_or_create(name='Fall', year='2016'),
    Semester.objects.get_or_create(name='Spring', year='2017'),
    Semester.objects.get_or_create(name='Winter', year='2017'),
  ]

  print "Created {0} new terms".format(sum(is_new for (_, is_new) in new_rows))


if __name__ == '__main__':
  create_new_semesters()
