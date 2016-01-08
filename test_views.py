import unittest, time

from django.test import TestCase
from timetable.models import Course, CourseOffering, HopkinsCourse, HopkinsCourseOffering
from timetable.views import *

class CoursesToOfferings(TestCase):
  def setUp(self):
    self.start_time = time.time()

  def tearDown(self):
    t = time.time() - self.start_time
    print "%s: %.3f" % (self.id(), t)

  def test_no_preferences(self):
    test_courses = ["CSC148H1", "CSC108H1", "MAT137Y1"]
    sem = "F"
    courses = [Course.objects.get(id=5482)]
    result = courses_to_offerings(courses, sem)
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

if __name__ == '__main__':
  suite = unittest.TestLoader().loadTestsFromTestCase(CoursesToOfferings)
  unittest.TextTestRunner(verbosity=0).run(suite)