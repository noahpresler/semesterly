import unittest, time

from django.core.management.base import NoArgsCommand

from timetable.models import Course, CourseOffering, HopkinsCourse, HopkinsCourseOffering
from timetable.views import *

class Command(NoArgsCommand):
  help = """
  If you need Arguments, please check other modules in 
  django/core/management/commands.
  """

  def handle_noargs(self, **options):
    suite = unittest.TestLoader().loadTestsFromTestCase(CoursesToOfferings)
    unittest.TextTestRunner(verbosity=0).run(suite)


class CoursesToOfferings(unittest.TestCase):
  def setUp(self):
    self.default_locked = {'L': '', 'T': '', 'P': ''}
    self.start_time = time.time()

  def tearDown(self):
    t = time.time() - self.start_time
    print "%s: %.3f" % (self.id(), t)

  def test_no_preferences(self):
    test_courses = ['CSC148H1', 'CSC108H1', 'MAT137Y1']
    sem = 'F'
    # locked takes the format dict: course_code -> dict of locked sections.
    # any course codes that are not in locked take on the default_locked
    # attribute (usually no locked sections).
    locked = {}
    courses = [Course.objects.get(code=c) for c in test_courses]
    locked_sections = self.create_locked_sections_dict(test_courses, locked)
    answer = set([])

    result = courses_to_offerings(courses, sem, locked_sections)
    self.assertTrue(True)
    print result

  def create_locked_sections_dict(self, course_codes, course_to_locked):
    locked_sections = {}
    for code in course_codes:
      cid = self.get_cid(code)
      if code in course_to_locked:
        locked_sections[cid] = course_to_locked[code]
      else:
        locked_sections[cid] = self.default_locked
    return locked_sections

  def get_cid(self, course_code):
    return str(Course.objects.get(code=course_code).id)
    