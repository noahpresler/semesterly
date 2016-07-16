""" A parser which reads from json outputed by a BaseWriter and saved to db. """
import json
import os
import sys

from scripts.base_parser import BaseParser


class JsonParser(BaseParser):
  def __init__(self, filename):
    BaseParser.__init__(self)
    self.filename = filename

  def get_course_elements(self):
    with open(filename, 'r') as infile:
      for line in infile.readlines():
        yield json.loads(line)

  def parse_course_element(self, course_element):
    return course_element['course_code'], course_element['course_data']

  def get_section_elements(self, course_element):
    return course_element['sections']

  def parse_section_element(self, section_element):
    return section_element['section_code'], section_element['section_data']

  def get_meeting_elements(self, section_element):
    return section_element['meetings']

  def parse_meeting_element(self, meeting_element):
    return meeting_element

if __name__ == '__main__':
  if len(sys.argv) != 2:
    print "Usage: python -m scripts.save_json file.json"
    sys.exit(1) 
  filename = sys.argv[1]
  parser = JsonParser(filename)
  parser.parse_courses()
