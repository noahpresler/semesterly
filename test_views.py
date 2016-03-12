import unittest, time

from django.test import TestCase
from timetable.models import Course, CourseOffering
# from timetable.views import *

class Conflicts(TestCase):
  def setUp(self):
    self.start_time = time.time()

    # create first course offering
    Course.objects.create(code='C1', name='Course One')
    c1 = Course.objects.get(code='C1')
    CourseOffering.objects.create(course=c1,
                                  semester='S',
                                  meeting_section='CO1',
                                  day='M',
                                  time_start='',
                                  time_end='')

    # create second course offering
    Course.objects.create(code='C2', name='Course Two')
    c2 = Course.objects.get(code='C2')
    CourseOffering.objects.create(course=c1,
                                  semester='S',
                                  meeting_section='CO1',
                                  day='M',
                                  time_start='',
                                  time_end='')


  def tearDown(self):
    t = time.time() - self.start_time
    print "%s: %.3f" % (self.id(), t)

  def test_overlay(self):
    self.assertTrue(True)

  def test_squeeze(self):
    self.assertTrue(True)

if __name__ == '__main__':
  suite = unittest.TestLoader().loadTestsFromTestCase(Conflicts)
  unittest.TextTestRunner(verbosity=0).run(suite)
  