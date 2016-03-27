from urllib2 import urlopen
import requests
import re
import datetime
import sys
import json
import time
from itertools import product
from string import capwords

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import RutgersCourse, RutgersCourseOffering


class InvalidSemesterException(Exception):
  pass


def parse_time(time):
  """Convert hhmm to h:mm."""
  parsed = time[:2] + ':' + time[2:]
  return parsed[1:] if parsed[0] == '0' else parsed

def parse_location(campus, building, room):
  if not campus or not building or not room:
    return 'TBD'
  return "{0} {1}-{2}".format(campus, building, room)

def parse_instructor(name):
  """Convert 'last[, first initial]' to '[first initial. ]last'."""
  if not name:
    return 'TBD'
  if len(name.split(', ')) < 2:
    return capwords(name)
  last, first = name.split(', ')
  return first + '. ' + capwords(last)

def parse_day(day):
  return 'R' if day == 'TH' else day


# api info: http://api.rutgers.edu/#soc
api_key = "9fb3fc0b514922ecfccccd863cb40c6c"
year = str(datetime.datetime.now().year)
subjects_url = "http://catalogs.rutgers.edu/generated/nb-ug_0507/pg20298.html"
api_url = "http://sauron.rutgers.edu/~rfranknj/soc/api.php?key={0}" + \
          "&semester={1}&subj={2}&campus={3}&level=U"


def parse_rutgers():
  # find subject numbers by just looking for 3 number seqs surrounded by spaces
  # works well but maybe not very robust if they change the html
  print "retrieving subject codes"
  html = urlopen(subjects_url).read()
  subjects = [s.strip() for s in re.findall(' [0-9]+ ', html)]
  subjects = filter(lambda s: len(s) == 3, subjects)
  campuses = ['NB'] # ['NB', 'NK', 'CM']
  semesters = ['F', 'S']

  num_created = 0
  num_updated = 0
  print "parsing courses"
  start_time = time.time()

  for subject, campus, semester in product(subjects, campuses, semesters):
    session = ('9' if semester == 'F' else '1') + year
    response = requests.get(api_url.format(api_key, session, subject, 'NB'))
    courses = response.json()
    if not courses:
      print "SKIPPED subject number {0}".format(subject)
      continue
    for c in courses:
      # get RutgersCourse fields
      code = subject + ':' + c['courseNumber']
      description = c['courseDescription'] or 'Currently not available'
      name = capwords(c['expandedTitle']).strip() if c['expandedTitle'] else c['title']
      course_data = {
        'name': name,
        'description': description,
        'campus': campus,
      }
      # get or update object
      course_obj, created = RutgersCourse.objects.update_or_create(code=code,
                                                          defaults=course_data)
      # add course's courseofferings
      for section in c['sections']:
        instructors = [inst['name'] for inst in section['instructors']]
        section_code = section['number']
        for offering in section['meetingTimes']:
          if offering['meetingDay'] in ['SA', 'SU']:
            print "SKIPPED weekend offering"
            continue
          if not (offering['meetingDay'] and \
                  offering['startTime'] and \
                  offering['endTime']):
            print "SKIPPED offering with no set time"
            continue
          o_data = {
            'day': parse_day(offering['meetingDay']),
            'time_start': parse_time(offering['startTime']),
            'time_end': parse_time(offering['endTime']),
            'instructors': ', '.join(map(parse_instructor, instructors)),
            'location': parse_location(offering['campusAbbrev'] or 'TBD',
                                       offering['buildingCode'] or 'TBD',
                                       offering['roomNumber'] or 'TBD'),
            'section_type': offering['meetingModeDesc']
          }
          obj, _ = RutgersCourseOffering.objects.update_or_create(course=course_obj,
                                                    semester=semester,
                                                    meeting_section=section_code,
                                                    defaults=o_data)
      # print and update counts
      action = "CREATED" if created else "UPDATED"
      print "{0} {1} ==> {2} offerings".format(action, 
                                              course_data['name'], 
                                              len(c['sections']))
      num_created += created
      num_updated += (1 - created)

  end_time = time.time()
  seconds_elapsed = end_time - start_time
  print "Finished parsing in {0} minutes".format(int(seconds_elapsed)/60)
  print "{0} udpated and {1} created courses in total".format(num_updated,
                                                              num_created)

if __name__ == '__main__':
  parse_rutgers()
  