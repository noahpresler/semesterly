import unittest, time

from django.test import TestCase
# from timetable.models import Course, CourseOffering
# from timetable.views import *

class Conflicts(TestCase):
  def setUp(self):
    self.start_time = time.time()
    # Course.objects.create(code='C1', name='Course One')
    # CourseOffering.objects.create()
    # Course.objects.create(code='C2', name='Course Two')


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