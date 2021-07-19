# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import abc
import json


class BaseWriter(metaclass=abc.ABCMeta):
  def __init__(self, semester=None):
    self.semester = semester

  def write_courses(self, filename):
    """Update database with courses and offerings for given semester."""
    f = open(filename, 'w').close() # clear current contents
    with open(filename, 'a') as outfile:
      for i, course_element in enumerate(self.get_course_elements()):
        outfile.write(self.get_course_writable(course_element) + '\n')

  def get_course_writable(self, course_element):
    """
    Update database with new course and its offerings corresponding to the given
    bs4 element.
    """
    course_code, course_data = self.parse_course_element(course_element)

    section_writables = list(map(self.get_section_writable, 
                            self.get_section_elements(course_element)))

    course_writable = {
      'course_code': course_code,
      'course_data': course_data,
      'sections': section_writables
    }
    return json.dumps(course_writable)

  def get_section_writable(self, section_element):
    section_code, section_data = self.parse_section_element(section_element)
    section_data['semester'] = section_data.get('semester', self.semester)

    meeting_writables = list(map(self.get_meeting_writable,
                            self.get_meeting_elements(section_element)))

    section_writable = {
      'section_code': section_code,
      'section_data': section_data,
      'meetings': meeting_writables
    }
    return section_writable

  def get_meeting_writable(self, meeting_element):
    return self.parse_meeting_element(meeting_element)

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
    for the course, and a dictionary of any other attributes to be writed from
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
from scripts.base_parser import BaseParser


class SchoolParser(BaseParser):
  def __init__(self):
    BaseParser.__init__(self)

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
      # required if not provided to BaseParser:
      'semester': None,

      # optional
      'section_type': None,
      'instructors': None,
      'size': None,
      'enrolment': None,
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

