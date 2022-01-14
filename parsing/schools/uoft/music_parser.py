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

import pandas as pd
from copy import deepcopy
from numpy import nan
import re

from scripts.base_writer import BaseWriter
from scripts.common import *


class UofTMusicWriter(BaseWriter):
  def __init__(self, sheet_path='scripts/uoft/timetable2016-17.xls'):
    self.data = get_tt_df(sheet_path) # get data first to pass num rows to base parser
    BaseWriter.__init__(self)
    self.row_iter = self.data.iterrows()
    self.next_course_row = next(self.row_iter)[1] # stores the header row of the next course

  def get_course_elements(self):
    try: # iterate through iterator until the end
      while True:
        course_header_row = self.next_course_row
        while not course_header_row.sem or not re.match('[A-Z]{3}[0-9]{3}[HY][0-9]', course_header_row.course_code):
          course_header_row = next(self.row_iter)[1]

        course_rows = [course_header_row]
        next_row = next(self.row_iter)[1]
        while not next_row.course_code:
          course_rows.append(next_row)
          next_row = next(self.row_iter)[1]
        # save to be used as header in next iteration of while loop
        self.next_course_row = next_row
        yield course_rows
    except StopIteration:
      pass

  def parse_course_element(self, course_element):
    """Here course_element is a list of rows corresponding to a course."""
    course_code = course_element[0].course_code
    course_data = {
      # mandatory
      'name': ' '.join([row.title for row in course_element if row.title]),
      'school': 'uoft',

      # optional
      'description': '',
      'num_credits': course_element[0].credits or 0.5,
      'campus': 1,
      'areas': '(1)',
      'department': 'MUS',
      'level': course_code[3] + '00',
    }
    return course_code, course_data

  def get_section_elements(self, course_element):
    sections = []
    for row in course_element:
      row.sem = course_element[0].sem
      if row.meeting_name:
        sections.append([row])
      elif sections:
        sections[-1].append(row)

    # check for sections whcih have F/S as semester, and split them
    for section in sections:
      if section[0].sem == 'F/S':
        copy = deepcopy(section)
        section[0].sem = 'F'
        copy[0].sem = 'S'
        sections.append(copy)

    return sections

  def parse_section_element(self, section_element):
    section_code = section_element[0].meeting_name
    section_data = {
      # required if not provided to BaseParser:
      'semester': section_element[0].sem,

      # optional
      'section_type': section_code[0],
      'instructors': ', '.join([row.instructor for row in section_element if row.instructor]),
    }
    return section_code, section_data

  def get_meeting_elements(self, section_element):
    meetings = []
    for row in section_element:
      if row.day_time:
        meetings.append([row])
      elif meetings:
        meetings[-1].append(row)

    # check for meetings which have multiple days, and split them
    for meeting in meetings:
      split_index = find_first_number(meeting[0].day_time)
      if split_index > 1: # more than one day
        for i in range(1, split_index):
          copy = deepcopy(meeting)
          copy[0].day_time = meeting[0].day_time[i] + meeting[0].day_time[split_index:]
          meetings.append(copy)
        meeting[0].day_time = meeting[0].day_time[0] + meeting[0].day_time[split_index:]

    return meetings

  def parse_meeting_element(self, meeting_element):
    if meeting_element[0].day_time.lower() == 'tba':
      return None
    start, end = parse_range_time(meeting_element[0].day_time[1:])
    meeting_data = {
      # mandatory
      'day': meeting_element[0].day_time[0],
      'time_start': start,
      'time_end': end,

      # optional
      'location': ', '.join([str(row.location) for row in meeting_element if row.location])
    }
    return meeting_data

def get_tt_df(path):
  xl = pd.ExcelFile(path)
  colnames = ['course_code',
              'sem',
              'credits',
              'title',
              'meeting_name',
              'hrs',
              'day_time',
              'location',
              'instructor',
              'enrol_indicator',
              'enrol_controls']
  return xl.parse('FM', skiprows=4, parse_cols=len(colnames) - 1, names=colnames).fillna('')

def find_first_number(s):
  """ Get index of the first number appearing in s, assuming there is one. """
  for i, char in enumerate(s):
    if char in '0123456789':
      return i

if __name__ == '__main__':
  parser = UofTMusicWriter()
  parser.write_courses('music_courses.json')
