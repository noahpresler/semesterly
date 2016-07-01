import os

from selenium import webdriver
from selenium.webdriver.support.ui import Select
from time import sleep

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

# search results stuff
section_table_id = 'ACE_$ICField48$0'
section_table_cols = 3  
section_table_class ='PABACKGROUNDINVISIBLE'
section_td_class = 'PSLEVEL3GRIDROW'


class QueensParser(BaseParser):
  def __init__(self, semester, year, debug=False):
    BaseParser.__init__(self)
    self.semester = 'F' if semester == 'Fall' else 'S'
    self.driver = webdriver.Chrome(None) if debug else webdriver.PhantomJS()

  def get_course_elements(self):
    print "LOGGING IN"
    self.driver.get('https://my.queensu.ca/')
    seleni_run(lambda: self.driver.find_element_by_id('username').send_keys('1dc4'))
    seleni_run(lambda: self.driver.find_element_by_id('password').send_keys('***REMOVED***'))
    seleni_run(lambda: self.driver.find_element_by_class_name('Btn1Def').click())

    print "NAVIGATING TO SOLUS"
    seleni_run(lambda: self.driver.find_element_by_link_text("SOLUS").click())

    print "NAVIGATING TO SEARCH PAGE"
    iframe = seleni_run(lambda: self.driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
    self.driver.switch_to_frame(iframe)
    seleni_run(lambda: self.driver.find_element_by_link_text("Search").click())

    print "SELECTING TERM 2016 Fall"
    self.select_term_by_term_string('{0} {1}'.format(year, semester))

    num_subjects = len(seleni_run(lambda: self.driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0'))\
                                              .find_elements_by_tag_name('option'))
    for i in range(1,num_subjects):
      print "SELECTING " + str(i) + "th SUBJECT"
      self.select_subject_by_index(i)
      self.click_search()
      # find section tables
      # get section rows
      # click on first row, return html of section page
      # yield (section page, section_rows)
      self.return_to_search()

  def select_subject_by_index(self, index):
    select = seleni_run(lambda: self.driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0'))
    select.find_elements_by_tag_name('option')[index].click()

  def self.select_term_by_term_string(self, term):
    select = Select(seleni_run(lambda: seleni_run(lambda: self.driver.find_element_by_id('CLASS_SRCH_WRK2_STRM$35$'))))
    select.select_by_visible_text(term)
    sleep(2)

  def self.click_search(self):
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

  def parse_course_element(self, course_element):
    course_soup = course_element[0]
    page_title = get_field_text(course_soup, course_title_id)
    course_code = ' '.join(page_title.split()[:2])
    course_data = {
      # mandatory
      'name': ' '.join(page_title.split()[4:]), 
      'school': 'queens',

      # optional
      'description': get_field_text(course_soup, description_id),
      'num_credits': int(get_field_text(course_soup, units_id).split()[0]),
      'campus': get_field_text(course_soup, campus_id),
      'prerequisites': extract_prereqs(get_text_field(course_soup, prereq_id)),
      'exclusions': extract_exclusions(get_text_field(course_soup, prereq_id)),
      'department': page_title.split()[0],
      'level': course_code.split()[1][0],
    }

    return course_code, course_data

  def get_section_elements(self, course_element):
    section_table = course_element[1]
    all_rows = section_table.tr
    for i in range(1, len(all_rows), 2):
      yield get_section_cols(all_rows[i])

  def parse_section_element(self, section_element):
    section_info = section_element[1].a.text.split('<br>')[0]
    instructors = section_element[4].text.split('<br>')

    section_code = section_info.split('-')[0].strip()
    section_data = {
      'semester': self.semester
      'section_type': section_info.split('-')[1].strip(),
      'instructors': get_uniq_profs(instructors),
      'size': None,
      'enrolment': None,
      'size': None,
      'waitlist': None,
      'waitlist_size': None,
    }
    return section_code, section_data

  def get_meeting_elements(self, section_element):
    # return iterzip
    return zip(section_element[2].text.split('<br>'), 
                section_element[3].text.split('<br>'))

  def parse_meeting_element(self, meeting_element):
    time_info, place_info = meeting_element
    day, start, _, end = time_info.split()
    meeting_data = {
      # mandatory
      'day': 'R' if day == 'Th' else day[0]),
      'time_start': parse_tz_time(start),
      'time_end': parse_tz_time(end),

      # optional
      'location': place_info.strip()
    }
    return meeting_data

def get_field_text(soup, span_id):
  return soup.find('span', {'id': span_id}).text

def extract_prereqs(general_info):
  return general_info # TODO

def extract_exclusions(general_info):
  return general_info # TODO

def get_uniq_profs(profs_by_meeting):
  profs = set([prof for prof in profs_by_meeting.split(',')])
  return ', '.join(profs)

def get_section_cols(section_element):
  return [col.div.span for col in section_element.findAll('td', {'class': section_td_class})]

if __name__ == '__main__':
  parser = QueensParser('Fall', 2016)
  parser.parse_courses()