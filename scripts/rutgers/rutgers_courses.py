import requests
import datetime
import sys
import os
import re
import time

from itertools import product
from urllib2 import urlopen
from string import capwords
from selenium.common.exceptions import WebDriverException
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from bs4 import BeautifulSoup

from scripts.base_parser import BaseParser

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

time_pattern = r'[0-9]+:[0-9]+ [AP]M - [0-9]+:[0-9]+ [AP]M'
code_pattern = r'\d{2}:\d{3}:\d{3}'

def process_time(s):
  """eg 7:30 PM -> 19:30"""
  time, merid = s.split()
  h, m = time.split(':')
  if merid == 'PM' and h != '12':
    h = str(int(h) + 12)
    return h + ':' + m
  else:
    return time 

class RutgersParser(BaseParser):
  def __init__(self, semester, campuses=['NB', 'NK', 'CM'], driver=None):
    BaseParser.__init__(self, RutgersCourse, 
                              RutgersCourseOffering,
                              semester)
    self.semester = semester
    self.campuses = campuses
    self.get_element = self.driver.find_element_by_css_selector
    self.entry_url = "https://sis.rutgers.edu/soc/"
    self.driver = webdriver.Chrome(driver) if driver else webdriver.Chrome()
    # intialize state variables for parser
    self.campus = None

  def get_course_elements(self):
    self.driver.get(self.entry_url)
    current_year = str(datetime.datetime.now().year)
    start_month = '9' if self.semester == 'F' else '1'
    session = start_month + current_year
    
    # select semester, campuses, levels, then submit
    self.select_semester(session)
    for campus in self.campuses:
      self.select_campus(campus)
      self.campus = campus
    for level in ['U', 'G']: # parse both undergraduate and graduate
      self.select_level(level)
    self.get_element("button[type='submit'][id='continueButton']").click()
    search_url = self.driver.current_url

    # get every row for every subject
    subjects = self.get_subjects()
    for subject in subjects:
      while True:
        try:
          self.select_subject(subject)
          break
        except:
          time.sleep(3)
          self.driver.get(search_url)
      soup = BeautifulSoup(self.driver.page_source)
      while soup.find('div', class_='subject') is None: # wait until courses load
        time.sleep(1)
        soup = BeautifulSoup(self.driver.page_source)
      rows = soup.find_all('div', class_='subject')
      for row in rows:
        yield row

  def parse_course_element(self, course_element):
    course_code = re.search(code_pattern, str(course_element)).group()
    title_element = course_element.find('span', class_='courseTitle')
    if not course_code or not title_element:
      return None, None
    title = title_element.span.text
    synopsis_element = course_element.find('span', class_='synopsis').span
    description = synopsis_element['onclick'].split('"')[1] if synopsis_element\
                  else ''
    num_credits = course_element.find('span', class_='courseCredits')\
                                .text.split()[0]
    try:
      num_credits = float(num_credits)
    except ValueError:
      num_credits = -1
    core_element = course_element.find('div', class_='coreCodes')
    core_code = core_element.text if core_element else ''
    course_data = {'name': title, 
                  'description': description,
                  'campus': self.campus,
                  'cores': core_code,
                  'num_credits': num_credits}
    return course_code, course_data

  def get_section_elements(self, course_element):
    return course_element.find('div', class_='sectionListings').children

  def parse_section_element(self, section_element):
    section_code = section_element.find('span', class_='sectionDataNumber').span.text
    instructors = section_element.find('span', class_='instructors').text
    exam_code = section_element.find('span', class_='examCode').text
    return section_code, {'instructors': capwords(instructors), 'exam_code': exam_code}

  def get_meeting_elements(self, section_element):
    return section_element.find('div', class_='sectionMeetingTimesDiv').children

  def parse_meeting_element(self, meeting_element):
    time_is_set = bool(meeting_element.find('span', class_='meetingTimeDay'))
    if not time_is_set:
      return None
    day = meeting_element.find('span', class_='meetingTimeDay').text
    time = meeting_element.find('span', class_='meetingTimeHours').text
    campus = meeting_element.find('span', class_='meetingTimeCampus').text
    location = meeting_element.find('span', class_='meetingTimeBuildingAndRoom').text
    if day in ['Saturday', 'Sunday'] or not re.match(time_pattern, time):
      return None
    time_start, time_end = map(process_time, time.split(' - '))
    meeting_data = {
      'day': 'R' if day == 'Thursday' else day[0],
      'time_start': time_start,
      'time_end': time_end,
      'location': campus + ' ' + location
    }
    return meeting_data

  def select_semester(self, session):
    self.get_element("input[type='radio'][value='{0}']".format(session)).click()

  def select_campus(self, campus):
    self.get_element("input[type='checkbox'][value='{0}']".format(campus)).click()

  def select_level(self, level):
    self.get_element("input[type='checkbox'][value='{0}']".format(level)).click()

  def get_subjects(self):
    self.open_subjects_menu()
    soup = BeautifulSoup(self.driver.page_source)
    menu = soup.find('div', {'data-dojo-attach-point': 'containerNode',
                            'class': ['dijitDialogPaneContent', 'dijitAlignCenter']})
    subject_nodes = menu.children
    subjects = (node.input.get('value') for node in subject_nodes)
    self.close_subjects_menu()
    return subjects

  def open_subjects_menu(self):
    link_div = self.get_element("div[id='multi_subject_link']")
    link_div.find_element_by_tag_name("span").click()

  def close_subjects_menu(self):
    self.get_element("span[data-dojo-attach-point='closeButtonNode']").click()

  def select_subject(self, subject):
    time.sleep(0.5)
    self.open_subjects_menu()
    time.sleep(0.5)
    # reset chosen sujects
    self.get_element("button[id='multiSubjectReset']").click()
    time.sleep(0.5)
    # check subject
    self.get_element("input[type='checkbox'][value='{0}']".format(subject)).click()
    time.sleep(0.5)
    # submit
    self.get_element("button[id='multiSubjectSubmit']").click()
    time.sleep(0.5)

def try_until_success(f):
  """Try to click something until success."""
  try:
    while True:
      success = f()
      if success:
        break
  except WebDriverException:
    time.sleep(0.5)

def parse_rutgers():
  print 'parsing fall:'
  RutgersParser('F').parse_courses()
  print 'parsing spring:'
  RutgersParser('S').parse_courses()

if __name__ == '__main__':
  if len(sys.argv) < 2:
    parse_rutgers()
  elif sys.argv[1] not in ['F', 'S']:
    print "Please provide either F or S for semester"
  else:
    RutgersParser(sys.argv[1]).parse_courses()

