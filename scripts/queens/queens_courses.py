from qcumber_scraper.main import JobManager
from scripts.base_parser import BaseParser

days = ['_', 'M', 'T', 'W', 'R', 'F']

class QueensParser(BaseParser):
  def __init__(self):
    BaseParser.__init__(self, 'S')

  def get_course_elements(self):
    try:
        from qcumber_scraper.queens_config import USER, PASS
    except ImportError:
        print "No credientials found. Create a queens_config.py file with" + \
              " USER and PASS constants"
        return

    # valid "seasons": Fall, Winter, Summer
    for course in JobManager(USER, PASS, True, {'semesters': [('Winter', '2016')]}).parse_courses():
      yield course

  def parse_course_element(self, course_element):
    ce = course_element
    course_code = ce['basic']['subject'] + ' ' + ce['basic']['number']
    course_data = {
      'name': ce['basic']['title'],
      'school': 'queens',
      'description': ce['basic']['description'],
      'num_credits': int(float(ce['extra']['units'])),
      'prerequisites': ce['extra'].get('enrollment_requirement', '')
    }
    return course_code, course_data

  def get_section_elements(self, course_element):
    for section in course_element['sections']:
      if valid_section(section):
        yield section

  def parse_section_element(self, section_element):
    se = section_element

    # get list of instructors
    instructors = set()
    for meeting in section_element['classes']:
      for instructor in (meeting['instructors'] or []):
        instructors.add(instructor)

    section_code = se['_unique']
    section_data = {
      'section_type': se['basic']['type'],
      'instructors': '; '.join(instructors) if instructors else 'TBD',
    }

    if 'availability' in section_element:
      try:
        avail_data = {
          'size': int(se['availability']['class_max']),
          'waitlist_size': int(se['availability']['wait_max']),
          'enrolment': int(se['availability']['class_curr']),
          'waitlist': int(se['availability']['wait_curr'])
        }
        section_data.update(avail_data)
      except KeyError:
        pass
    return section_code, section_data

  def get_meeting_elements(self, section_element):
    for meeting in section_element['classes']:
      yield meeting

  def parse_meeting_element(self, meeting_element):
    weekend_meeting = int(meeting_element['day_of_week'] or 6) > 5
    if missing_info(meeting_element) or weekend_meeting:
      return False

    meeting_data = {
      'day': days[int(meeting_element['day_of_week'])],
      'time_start': process_time(meeting_element['start_time']),
      'time_end': process_time(meeting_element['end_time']),
      'location': meeting_element['location']
    }
    return meeting_data

def process_time(s):
  """datetime.time -> ?H:MM"""
  string = s.strftime('%H:%M')
  return string[1:] if string[0] == '0' else string

def valid_section(section_element):
  summer = section_element['basic']['season'] != 'Summer'
  return summer or any((missing_info(me) for me in section_element['classes']))

def missing_info(meeting_element):
  return not all([meeting_element[info] for info in ['day_of_week', 'end_time', 'start_time']])

if __name__ == '__main__':
  QueensParser().parse_courses()