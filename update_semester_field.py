from collections import Counter
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from operator import attrgetter
from pprint import pprint

from timetable.models import Section, Semester
from analytics.models import *
from student.models import PersonalTimetable


# schools whose second semester is called the winter semester (instead of spring)
winter_schools = {'uoft', 'queens', 'umich', 'umich2'}
valid_semesters = 'FSY'

def update_sem_fields(table, get_school, sem_table=Semester):
  """ Link each row to corresponding Semester based on row._semester """
  num_updated = 0
  name_year_to_semester = {}
  bad_inputs = Counter()
  for row in table.objects.all():
    semester_code = row._semester
    name = code_to_name(semester_code, get_school(row))
    year = '2017' if semester_code == 'S' else '2016'

    # avoid .get or .setdefault because of eager evaluation of DB access
    if (name, year) not in name_year_to_semester:
      try:
        name_year_to_semester[(name, year)] = sem_table.objects.get(name=name, year=year)
      except:
        bad_inputs[semester_code] += 1
        continue
    semester = name_year_to_semester[(name, year)]

    row.semester = semester
    row.save()
    num_updated += 1

  print "Updated {0}/{1} rows from table {2}".format(num_updated, len(table.objects.all()), str(table))
  print "Ignored the following unknown semester codes:"
  pprint(bad_inputs)
  print

def code_to_name(semester_code, school):
  """ Take a valid semester code for a school and return its full name """
  if semester_code == 'F':
    return 'Fall'
  elif semester_code == 'Y':
    return 'Full Year'
  else:
    return 'Winter' if school in winter_schools else 'Spring'


if __name__ == '__main__':
  update_sem_fields(Section, get_school=attrgetter('course.school'))
  for table in [SharedTimetable, AnalyticsTimetable, AnalyticsCourseSearch, PersonalTimetable]:
    update_sem_fields(table, get_school=attrgetter('school'))
