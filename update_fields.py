from collections import Counter
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from pprint import pprint

from timetable.models import Section
from timetable.school_mappers import VALID_SCHOOLS

# schools whose second semester is called the winter semester (instead of spring)
winter_schools = {'uoft', 'queens', 'umich', 'umich2'}
valid_semesters = 'FSY'

def update_section_fields():
  """ Add values to Section.sem_name and Section.year based on Section.semester """
  num_updated = 0
  bad_semesters = Counter()
  for section in Section.objects.all():
    semester_code = section.semester
    if semester_code not in valid_semesters:
      bad_semesters[semester_code] += 1
    else:
      section.sem_name = code_to_name(semester_code, section.course.school)
      section.year = '2017' if semester_code == 'S' else '2016'
      section.save()
      num_updated += 1

  print "Updated {0} sections' terms".format(num_updated)
  print "Found the following invalid semester codes:"
  pprint(bad_semesters)

def code_to_name(semester_code, school):
  """ Take a valid semester code for a school and return its full name """
  if semester_code == 'F':
    return 'Fall'
  elif semester_code == 'Y':
    return 'Full year'
  else:
    return 'Winter' if school in winter_schools else 'Spring'
    
if __name__ == '__main__':
  update_section_fields()
