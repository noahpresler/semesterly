import abc
import time
import progressbar
import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import Course, Section, Offering


class BaseParser:
  __metaclass__ = abc.ABCMeta

  def __init__(self, semester, num_courses=None):
    self.semester = semester
    self.num_courses = num_courses

  def parse_courses(self):
    """Update database with courses and offerings for given semester."""
    max_val = self.num_courses or progressbar.UnknownLength
    bar = progressbar.ProgressBar(max_value=max_val)
    for i, course_element in enumerate(self.get_course_elements()):
      self.parse_and_save_course(course_element)
      bar.update(i)

  def parse_and_save_course(self, course_element):
    """
    Update database with new course and its offerings corresponding to the given
    bs4 element.
    """
    course_code, course_data = self.parse_course_element(course_element)
    if course_code:
      course_obj, _ = Course.objects.update_or_create(code=course_code,
                                                        defaults=course_data)
      for section_element in self.get_section_elements(course_element):
        self.parse_and_save_section(section_element, course_obj)

  def parse_and_save_section(self, section_element, course_obj):
    """
    Update database with new section and its offerings corresponding to the given
    bs4 element and django course object.
    """
    section_code, section_data = self.parse_section_element(section_element)
    if section_code:
      section_obj, _ = Section.objects.update_or_create(course=course_obj,
                                                          meeting_section=section_code,
                                                          semester=self.semester,
                                                          defaults=section_data)
      for meeting_element in self.get_meeting_elements(section_element):
        self.parse_and_save_meeting(meeting_element, section_obj)

  def parse_and_save_meeting(self, meeting_element, section_obj):
    """
    Update database with new offering corresponding to the given bs4 element 
    and other data.
    """
    meeting_data = self.parse_meeting_element(meeting_element)
    if meeting_data:
      Offering.objects.update_or_create(section=section_obj, defaults=meeting_data)

  @abc.abstractmethod
  def get_course_elements(self):
    """
    Return a generator of bs4 elements each corresponding to a single course.
    Optionally, set self.num_courses to the number of courses to be parsed
    (if known before hand) to enable progress bar display.
    """

  @abc.abstractmethod
  def parse_course_element(self, course_element):
    """
    Take a bs4 element corresponding to a course, and return the course code
    for the course, and a dictionary of any other attributes to be saved from
    that course. The keys of the dictionary should match the column names in
    the model for the course (e.g. name, description). If invalid data, return
    None, None
    """

  @abc.abstractmethod
  def get_section_elements(self, course_element):
    """
    Return a generator of bs4 elements corresponding to the sections of the
    given course.
    """

  @abc.abstractmethod
  def parse_section_element(self, section_element):
    """
    Take a bs4 element corresponding to a section, and return the section code
    for the section, and a dictionary of any other attributes to be saved from
    that section. The keys of the dictionary should match the column names in
    the model for the section (e.g. instructors, section_type). If invalid
    data, return None, None
    """

  @abc.abstractmethod
  def get_meeting_elements(self, section_element):
    """
    Return a generator of bs4 elements corresponding to the meetings of the
    given section.
    """

  @abc.abstractmethod
  def parse_meeting_element(self, meeting_element):
    """
    Take a bs4 element corresponding to a meeting, and return a dictionary 
    of attributes to be saved from that meeting. The keys of the dictionary 
    should match the column names in the model for the section (e.g. day, 
    time_start, time_end, location, etc.). If invalid data, return None.
    """

# TEMPLATE FOR BASEPARSER SUBCLASS:
"""
import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import SchoolCourse, SchoolCourseOffering
from scripts.base_parser import BaseParser


class SchoolParser(BaseParser):
  def __init__(self):
    BaseParser.__init__(self, SchoolCourse,
                              SchoolCourseOffering)

  def get_course_elements(self):
    pass

  def parse_course_element(self, course_element):
    coures_code = None
    course_data = {
      # mandatory
      'name': None, 
      'school': None,

      # optional
      'description': None,
      'num_credits': None,
      'campus': None,
      'prerequisites': None,
      'exclusions': None,
      'num_credits': None,
      'areas': None,
      'department': None,
      'level': None,

      # any other school specific fields
    }
    return course_code, course_data

  def get_section_elements(self, course_element):
    pass

  def parse_section_element(self, section_element):
    section_code = None
    section_data = {
      # optional
      'section_type': None,
      'instructors': None,
      'size': None,
      'enrolment': None,
      'size': None,
      'waitlist': None,
      'waitlist_size': None,
    }
    return section_code, section_data

  def get_meeting_elements(self, section_element):
    pass

  def parse_meeting_element(self, meeting_element):
    meeting_data = {
      # mandatory
      'day': None,
      'time_start': None,
      'time_end': None,

      # optional
      'location': None
    }
    return meeting_data
"""

