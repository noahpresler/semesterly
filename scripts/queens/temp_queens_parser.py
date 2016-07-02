#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os

from selenium import webdriver
from selenium.webdriver.support.ui import Select
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


class QueensParser(BaseParser):
  def __init__(self, semester, year, debug=False):
    BaseParser.__init__(self, 'F' if semester == 'Fall' else 'S')
    self.driver = webdriver.Chrome() if debug else webdriver.PhantomJS()

  def get_course_elements(self):
    print "LOGGING IN"
    self.driver.get('https://my.queensu.ca/')
    seleni_run(lambda: self.driver.find_element_by_id('username').send_keys('1dc4'))
    seleni_run(lambda: self.driver.find_element_by_id('password').send_keys('CREOmule1'))
    seleni_run(lambda: self.driver.find_element_by_class_name('Btn1Def').click())

    print "NAVIGATING TO SOLUS"
    seleni_run(lambda: self.driver.find_element_by_link_text("SOLUS").click())

    print "NAVIGATING TO SEARCH PAGE"
    self.focus_iframe()
    seleni_run(lambda: self.driver.find_element_by_link_text("Search").click())

    print "SELECTING TERM 2016 Fall"
    self.select_term_by_term_string("2016 Fall")

    num_subjects = len(seleni_run(lambda: self.driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0')).find_elements_by_tag_name('option'))
    for i in range(1,num_subjects):
      print "SELECTING SUBJECT #" + str(i)
      self.select_subject_by_index(i)
      print "SEARCH"
      self.click_search()
      sections = self.get_class_elements()
      print "GETTING SECTIONS HTML"
      for n in range(len(sections)):
        print "CLICKING"
        print str(n) + "/" + str(len(sections))
        self.get_nth_class_element(n,len(sections)).click()
        print "WAITING FOR PAGE LOAD"
        seleni_run(lambda: self.driver.find_element_by_class_name('PALEVEL0SECONDARY'))
        yield Soup(self.driver.page_source)
        print "RETURNING"
        seleni_run(lambda: self.driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_BACK')).click()
        print "RETURN"
      self.return_to_search()

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

  def return_to_search(self):
    while True:
      try: # try to find error
        self.driver.find_element_by_id('win0divDERIVED_CLSMSG_ERROR_TEXT')
        return
      except: # no error
        try: # try to find return to search button
          self.driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_MODIFY').click()
          return
        except:
          continue # try again

  def focus_iframe(self):
    print "FOCUSING IFRAME"
    iframe = seleni_run(lambda: self.driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
    self.driver.switch_to_frame(iframe)

  def get_nth_class_element(self, n, num_sections):
    # focus_iframe()
    print "GETTING CLASS ELEMENTS"
    while True:
      sections = seleni_run(lambda: self.driver.find_elements_by_css_selector("a[id^='MTG_CLASS_NBR']"))
      if len(sections) == num_sections:
        return sections[n]

  def get_class_elements(self):
    # focus_iframe()
    print "GETTING CLASS ELEMENTS"
    return seleni_run(lambda: self.driver.find_elements_by_css_selector("a[id^='MTG_CLASS_NBR']"))

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
      'num_credits': int(get_field_text(course_element, units_id).split()[0]),
      'campus': get_field_text(course_element, campus_id),
      'prerequisites': extract_prereqs(course_graph_info),
      'exclusions': extract_exclusions(course_graph_info),
      'department': page_title.split()[0],
      'level': course_code.split()[1][0],
    }
    print course_code, course_data
    return course_code, course_data

  def get_section_elements(self, course_element):
    return [course_element]

  def parse_section_element(self, section_element):
    section_code = get_field_text(section_element, course_title_id).split()[3]

    meeting_table = section_element.find('table', {'class': 'PSLEVEL1GRIDWBO'})
    meeting_rows = meeting_table.tbody.findChildren(recursive=False)[2:]
    all_instructors = [row.findChildren(recursive=False)[2].div.span.text for row in meeting_rows]
    avail_table = section_element.findAll('table', class_='PSGROUPBOXWBO')[2].tbody.tbody
    avail_rows = avail_table.findAll('tr')

    section_data = {
      'semester': self.semester,
      'section_type': get_field_text(section_element, subheader_id).split()[-1].strip(),
      'instructors': get_uniq_profs(all_instructors),
      'size': int(avail_rows[2].findAll('td')[1].find('span').text),
      'enrolment': int(avail_rows[4].findAll('td')[1].find('span').text),
      'waitlist_size': int(avail_rows[2].findAll('td')[3].find('span').text),
      'waitlist': int(avail_rows[4].findAll('td')[2].find('span').text)
    }
    return section_code, section_data

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
  return soup.find('span', {'id': span_id}).text

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
  parser = QueensParser('Fall', 2016, True)
  parser.parse_courses()