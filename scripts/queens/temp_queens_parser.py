#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os,re

from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.support import expected_conditions as EC
from time import sleep
from bs4 import BeautifulSoup as Soup

from scripts.base_parser import BaseParser
from scripts.common import *


# course page stuff
course_title_id = "DERIVED_CLSRCH_DESCR200"
class_number_id = "SSR_CLS_DTL_WRK_CLASS_NBR"
units_id = "SSR_CLS_DTL_WRK_UNITS_RANGE"
campus_id = "CAMPUS_TBL_DESCR"
prereq_id = 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'
capacity_id = 'SSR_CLS_DTL_WRK_ENRL_CAP'
description_id = 'DERIVED_CLSRCH_DESCRLONG'
meeting_table_id = 'PSLEVEL1GRIDWBO'
subheader_id = 'DERIVED_CLSRCH_SSS_PAGE_KEYDESCR'

# search results stuff
section_table_id = 'ACE_$ICField48$0'
section_table_cols = 3
section_table_class ='PABACKGROUNDINVISIBLE'
section_td_class = 'PSLEVEL3GRIDROW'

#class availability stuff
class_size_id = 'SSR_CLS_DTL_WRK_ENRL_CAP'
class_enrollment_id = 'SSR_CLS_DTL_WRK_ENRL_TOT'
class_waitlist_size_id = 'SSR_CLS_DTL_WRK_WAIT_CAP'
class_waitlist_id = 'SSR_CLS_DTL_WRK_WAIT_TOT'


class QueensParser(BaseParser):
  def __init__(self, semester, year, debug=False):
    BaseParser.__init__(self, 'F' if semester == 'Fall' else 'S')
    self.section_type_map = {
      'LEC': 'L',
      'TUT': 'T',
      'LAB': 'P',
    }
    self.debug = debug
    self.driver = webdriver.Chrome() if debug else webdriver.PhantomJS()
    self.start_index = 1
    self.section_index = 0
    self.term = "{0} {1}".format(year, semester)

  def get_course_elements(self):
    while True:
      try:
        for course_element in self._get_course_elements():
          yield course_element
        break
      except TimeoutException, StaleElementReferenceException:
        try:
          self.driver.switch_to_alert().accept()
        except:
          print "No XML alert, continuing"
        self.driver.quit()
        self.driver = webdriver.Chrome() if self.debug else webdriver.PhantomJS()
        print "Detected timeout or error, restarting parse from last parsed subject"

  def _get_course_elements(self):
    self.driver.get('https://my.queensu.ca/')
    seleni_run(lambda: self.driver.find_element_by_id('username').send_keys('1dc4'))
    seleni_run(lambda: self.driver.find_element_by_id('password').send_keys('CREOmule1'))

    seleni_run(lambda: self.driver.find_element_by_class_name('Btn1Def').click())
    seleni_run(lambda: self.driver.find_element_by_link_text("SOLUS").click())
    self.focus_iframe()
    seleni_run(lambda: self.driver.find_element_by_link_text("Search").click())
    self.select_term_by_term_string(self.term)

    num_subjects = len(seleni_run(lambda: self.driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0')).find_elements_by_tag_name('option'))
    for i in range(self.start_index, num_subjects):
      print "parsing subject {0} of {1}".format(i, num_subjects)
      self.select_subject_by_index(i)
      self.click_search()
      sections = self.get_class_elements()
      self.update_progress(0, len(sections))
      for n in range(self.section_index, len(sections)):
        self.update_progress(n + 1)
        # print str(n) + "/" + str(len(sections))
        nth_section_page = self.get_nth_class_element(n, len(sections))
        nth_section_page.click()
        seleni_run(lambda: self.driver.find_element_by_class_name('PALEVEL0SECONDARY'))
        yield Soup(self.driver.page_source)
        self.section_index = n
        seleni_run(lambda: self.driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_BACK')).click()
      self.section_index = 0
      self.return_to_search()
      self.start_index = i

  def select_subject_by_index(self, index):
    select = seleni_run(lambda: self.driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0'))
    select.find_elements_by_tag_name('option')[index].click()

  def select_term_by_term_string(self, term):
    select = Select(seleni_run(lambda: seleni_run(lambda: self.driver.find_element_by_id('CLASS_SRCH_WRK2_STRM$35$'))))
    select.select_by_visible_text(term)
    sleep(2)

  def click_search(self):
    seleni_run(lambda: self.driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH').click())
    sleep(2)

  @repeat_until_timeout
  def return_to_search(self):
    try: # try to find error
      self.driver.find_element_by_id('win0divDERIVED_CLSMSG_ERROR_TEXT')
      return True
    except: # no error
      try: # try to find return to search button
        self.driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_MODIFY').click()
        return True
      except:
        return # return None to try again

  def focus_iframe(self):
    iframe = seleni_run(lambda: self.driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
    self.driver.switch_to_frame(iframe)

  @repeat_until_timeout
  def get_nth_class_element(self, n, num_sections):
    sections = seleni_run(lambda: self.driver.find_elements_by_css_selector("a[id^='MTG_CLASS_NBR']"))
    if len(sections) == num_sections:
      return sections[n]

  @repeat_until_timeout
  def get_class_elements(self):
    try: # try to find error
      self.driver.find_element_by_id('win0divDERIVED_CLSMSG_ERROR_TEXT')
      return []
    except: # no error box
      try: # try to find sections
        num_str = self.driver.find_element_by_xpath("//*[contains(text(), 'class section(s) found')]").text
        n_expected = [int(s) for s in num_str.split() if s.isdigit()][0]
        found = []
        while n_expected != len(found):
          found = seleni_run(lambda: self.driver.find_elements_by_css_selector("a[id^='MTG_CLASS_NBR']"))
        return found
      except:
        return # return None to try again

  def parse_course_element(self, course_element):
    page_title = get_field_text(course_element, course_title_id)
    course_code = ' '.join(page_title.split()[:2])
    course_graph_info = get_field_text(course_element, prereq_id).split('\n')

    course_data = {
      # mandatory
      'name': ' '.join(page_title.split()[4:]),
      'school': 'queens',

      # optional
      'description': get_field_text(course_element, description_id),
      'num_credits': float(get_field_text(course_element, units_id).split()[0]),
      'campus': get_field_text(course_element, campus_id),
      'prerequisites': extract_prereqs(course_graph_info),
      'exclusions': extract_exclusions(course_graph_info),
      'department': page_title.split()[0],
      'level': course_code.split()[1][0],
    }
    # print course_code, course_data
    return (course_code, course_data) if course_data['name'] else (None, None)

  def get_section_elements(self, course_element):
    return [course_element]

  def parse_section_element(self, section_element):
    section_code = get_field_text(section_element, course_title_id).split()[3]

    meeting_table = section_element.find('table', {'class': 'PSLEVEL1GRIDWBO'})
    meeting_rows = meeting_table.tbody.findChildren(recursive=False)[2:]
    all_instructors = [row.findChildren(recursive=False)[2].div.span.text for row in meeting_rows]
    avail_table = section_element.find('td', text=re.compile(r'Class Availability')).parent.parent

    meeting_table = section_element.find('table', {'class': meeting_table_id})
    cols_by_row = [row.findChildren(recursive=False) for row in meeting_table.tbody.findChildren(recursive=False)[2:]]
    time_is_TBA = any(('TBA' in cols[0].div.span.text or len(cols[0].div.span.text.split()) != 4
                    for cols in cols_by_row))
    section_type = self.section_type_map.get(get_field_text(section_element, subheader_id).split()[-1].strip(), 'L')
    section_data = {
      'semester': self.semester,
      'section_type': section_type,
      'instructors': get_uniq_profs(all_instructors),
      'size': get_field_text(avail_table,class_size_id),
      'enrolment': get_field_text(avail_table,class_enrollment_id),
      'waitlist_size': get_field_text(avail_table,class_waitlist_size_id),
      'waitlist': get_field_text(avail_table,class_waitlist_id)
    }
    return (section_code, section_data) if not time_is_TBA else (None, None)

  def get_meeting_elements(self, section_element):
    meeting_table = section_element.find('table', {'class': meeting_table_id})
    first_dates = None
    for row in meeting_table.tbody.findChildren(recursive=False)[2:]:
      cols = row.findChildren(recursive=False)
      # TEMP: check if this meeting corresponds to the first set of meeting dates
      meeting_dates = cols[3].div.span.text
      if (meeting_dates == first_dates) or first_dates is None:
        first_dates = meeting_dates
        yield cols
      else:
        break

  def parse_meeting_element(self, columns):
    time_info = columns[0].div.span.text
    place_info = columns[1].div.span.text
    day, start, _, end = time_info.split()
    meeting_data = {
      # mandatory
      'day': 'R' if day == 'Th' else day[0],
      'time_start': parse_tz_time(start),
      'time_end': parse_tz_time(end),

      # optional
      'location': place_info.strip()
    }
    return meeting_data

def get_field_text(soup, span_id):
  try:
    return soup.find('span', {'id': span_id}).text
  except AttributeError: # couldn't find the element
    return ''

def extract_prereqs(relations):
  result = ''
  for relation in relations:
    if relation.lower().startswith('prerequisites') or relation.lower().startswith('recommended'):
      result += relation + ' '
  return result

def extract_exclusions(relations):
  result = ''
  for relation in relations:
    if relation.lower().startswith('exclusions'):
      return relation.split()[1:]
  return result

def get_uniq_profs(profs_by_meeting):
  profs = set([prof for prof in profs_by_meeting])
  return ', '.join(profs)

def get_section_cols(section_element):
  return [col.div.span for col in section_element.findAll('td', {'class': section_td_class})]

if __name__ == '__main__':
  parser = QueensParser('Winter', 2017, True)
  parser.parse_courses()