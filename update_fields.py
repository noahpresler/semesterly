from collections import Counter
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from operator import attrgetter
from pprint import pprint

from timetable.models import Section
from analytics.models import *
from student.models import PersonalTimetable
from timetable.school_mappers import VALID_SCHOOLS


# schools whose second semester is called the winter semester (instead of spring)
winter_schools = {'uoft', 'queens', 'umich', 'umich2'}
valid_semesters = 'FSY'

def update_sem_fields(table, get_school):
  """ Add values to table.sem_name and table.year based on table.semester """
  num_updated = 0
  bad_semesters = Counter()
  for row in table.objects.all().iterator():
    semester_code = row.semester
    if semester_code not in valid_semesters:
      bad_semesters[semester_code] += 1
    else:
      row.sem_name = code_to_name(semester_code, get_school(row))
      row.year = '2017' if semester_code == 'S' else '2016'
      row.save()
      num_updated += 1

  print "Updated {0}/{1} rows from table {2}".format(num_updated, len(table.objects.all()), str(table))
  print "Ignored the following invalid semester codes:"
  pprint(bad_semesters)
  print

def code_to_name(semester_code, school):
  """ Take a valid semester code for a school and return its full name """
  if semester_code == 'F':
    return 'Fall'
  elif semester_code == 'Y':
    return 'Full year'
  else:
    return 'Winter' if school in winter_schools else 'Spring'
    
if __name__ == '__main__':
  update_sem_fields(Section, get_school=attrgetter('course.school'))
  for table in [SharedTimetable, AnalyticsTimetable, AnalyticsCourseSearch, PersonalTimetable]:
    update_sem_fields(table, get_school=attrgetter('school'))
