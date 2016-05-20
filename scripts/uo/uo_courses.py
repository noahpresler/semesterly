import sys
import requests
import cookielib
import re
import os
import time
from pprint import pprint
from string import capwords

import django
import progressbar
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.support.ui import Select

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import Course, Section, Offering

'''#==========================================FOR PRODUCTION USE======================================
chrome_options = Options()
chrome_options.add_argument("--disable-extensions")

display=Display(visible=0, size=(800, 600))
display.start()

# If the Chrome Webdriver is not already in your $PATH, change this to
# represent its filepath
WEBDRIVER_CHROME = '/root/chromedriver_executable/chromedriver' # e.g. '/home/linoah/chromedriver'
#====================================================================================================='''


#===========================================FOR DEVELOPMENT USE=======================================
WEBDRIVER_CHROME = None
#=====================================================================================================

class OttawaParser:

  def safe_print(self,to_print):
    try:
      print to_print
    except UnicodeEncodeError:
      print "Print statement omitted for UnicodeEncodeError."

  def __init__(self, semester):
    self.num_parsed = 0
    self.s = requests.Session()
    self.cookies = cookielib.CookieJar()
    self.headers = {
      'User-Agent': 'My User Agent 1.0'
    }
    self.detail_base_url = "https://web30.uottawa.ca/v3/SITS/timetable/"
    self.base_url = "https://web30.uottawa.ca/v3/SITS/timetable/SearchResults.aspx"
    self.semester = semester
    self.safe_print("Parsing Data For: " + self.semester + " Semester")
    if not WEBDRIVER_CHROME:
      self.driver = webdriver.Chrome()
    else:
      self.driver = webdriver.Chrome(WEBDRIVER_CHROME)
    self.driver.get(self.base_url)

    # TODO: programmatically get year for semester
    if semester == 'F':
      self.sem_value = "20169"
    else:
      self.sem_value = "20161"

  def row_cond(self,x):
    if x:
      return x not in ["results-header","footer","hidden-header"]
    else:
      return False

  def detail_row_cond(self,x):
    if x:
      return x not in ["first-element","footer","hidden-header"]
    else:
      return False

  def get_search_results_html(self):
    while True:
        try:
          selector = Select(self.driver.find_element_by_id("ctl00_MainContentPlaceHolder_Basic_SessionDropDown"))
          selector.select_by_value(self.sem_value)
          break
        except Exception,e:
          print str(e)
          self.safe_print("Waiting for page load")
    self.safe_print("Term Has Been Selected")
    self.driver.find_element_by_id("ctl00_MainContentPlaceHolder_Basic_Button").click()
    while True:
      try:
        self.driver.find_element_by_id("main-content")
        break
      except:
        self.safe_print("Waiting for page load")
    return self.driver.page_source

  def parse_page_results(self, page_html, bar):
    soup = BeautifulSoup(page_html)
    table = soup.find('table', class_="result-table")
    if table is not None:
      rows = table.findAll('tr', {'class': self.row_cond})
      for row in rows:
        self.parse_course_row(row)
        self.num_parsed += 1
        bar.update(self.num_parsed)
      return True
    else:
      return False

  def to_cookielib_cookie(self,selenium_cookie):
    return cookielib.Cookie(
      version=0,
      name=selenium_cookie['name'],
      value=selenium_cookie['value'],
      port='80',
      port_specified=False,
      domain=selenium_cookie['domain'],
      domain_specified=True,
      domain_initial_dot=False,
      path=selenium_cookie['path'],
      path_specified=True,
      secure=selenium_cookie['secure'],
      expires=False,
      discard=False,
      comment=None,
      comment_url=None,
      rest=None,
      rfc2109=False
      )

  def put_cookies_in_jar(self, selenium_cookies, cookie_jar):
    cookie_jar.clear()
    for cookie in selenium_cookies:
      cookie_jar.set_cookie(self.to_cookielib_cookie(cookie))

  def parse_course_row(self,row):
    # get soup of html
    url = self.get_detail_link(row)
    self.put_cookies_in_jar(self.driver.get_cookies(),self.cookies)
    self.headers = {
      'Referer' : 'https://web30.uottawa.ca/v3/SITS/timetable/SearchResults.aspx'
    }
    html = self.get_html(url)
    soup = BeautifulSoup(html)

    # get course information
    code = self.get_course_code(row)
    title = soup.find('div', {'id': 'main-content'}).h1.text.strip()
    description = soup.find('div', {'id': 'main-content'}).p.text.strip()

    course_data = {
      'name': self.process_title(title),
      'description': description
    }
    course_obj, created = Course.objects.update_or_create(code=code,
                                                          defaults=course_data)
    sections_tables = soup.findAll('table',class_="display")
    for section_table in sections_tables:
      rows = section_table.findAll('tr', {'class': self.detail_row_cond})
      section_id = rows[0].find('td', class_="Section").text
      for row in rows:
        date_time = row.find(class_="Day").text
        meet_type = row.find(class_="Activity").text
        place = row.find(class_="Place").text
        prof = row.find(class_="Professor").text

        start, end, day = self.process_time(date_time)
        if day in ['S', 'TBD']: # skip weekends, undefined times
          continue
        prof = self.process_prof(prof)
        # meet_type example: Lecture 1, section_id example: BIO1001 A (random junk)
        # section_type example: Lecture, section_code example: A Lecture 1
        section_type = self.process_type(meet_type)
        section_code = section_id.split()[1] + ' ' + meet_type

        s_data = {
          'section_type': section_type,
          'instructors': prof
        }

        s_obj, _ = Section.objects.update_or_create(course=course_obj,
                                                  meeting_section=section_code,
                                                  semester=self.semester,
                                                  defaults=s_data)
        o_data = {
          'day': day,
          'time_start': start,
          'time_end': end,
          'location': place,
        }
        Offering.objects.update_or_create(section=s_obj, defaults=o_data)

  def get_detail_link(self,row):
    return self.detail_base_url+row.find('a')['href']

  def get_course_code(self,row):
    return row.find(class_="CourseCode").text

  def get_course_title(self,row):
    return row.find(class_="CourseTitle").text

  def parse_courses(self):
    html = self.get_search_results_html()
    result_soup = BeautifulSoup(html)
    num_results = result_soup.find('div', class_="result").text.split()[0]
    bar = progressbar.ProgressBar(max_value=int(num_results) + 1)
    while True:
      success = self.parse_page_results(html, bar)
      if not success:
        break
      self.driver.execute_script("__doPostBack('ctl00$MainContentPlaceHolder$ctl03','')")
      html = self.driver.page_source

  def get_html(self, url):
    html = None
    while html is None:
      try:
        r = self.s.get(url,cookies=self.cookies,headers=self.headers)
        if r.status_code == 200:
          html = r.text
      except (requests.exceptions.Timeout,
          requests.exceptions.ConnectionError):
        print "Unexpected error:", sys.exc_info()[0]
        
        continue
    return html.encode('utf-8')

  def process_time(self, date_time):
    """
    Break string of the form 'Monday 08:30 - 10:00' into separate semesterly
    compatible formats.
    """
    # website puts dummy times without day when undetermined e.g. '0:00 0:00'
    if len(date_time.split()) < 4: 
      return 'TBD', 'TBD', 'TBD'
    day, start, dash, end = date_time.split()
    day = 'R' if day == 'Thursday' else day[0]
    start = start[1:] if start[0] == '0' else start
    end = end[1:] if end[0] == '0' else end
    return start, end, day 

  def process_prof(self, prof):
    return 'TBD' if prof == 'Not available at this time.' else prof 

  def process_type(self, meet_type):
    """
    Get the section_type from the meeting code. Meeting code follows the format
    of 'sectiontype sectionnumber' e.g. Lecture 3 (return Lecture). Shortens
    special cases
    """
    special_cases = {
      'Audioconference course': 'Audioconf',
      'Course entirely via Internet': 'Online',
      'Course has on-line/classroom activities': 'Online/Classroom',
      'Videoconference course': 'Videoconf'
    }
    ret = ' '.join(meet_type.split()[:-1])
    return special_cases.get(ret, ret)

  def process_title(self, title):
    """
    Example: convert NSG5220 - ADV. NURS. PRAC. TERITARY CARE into
    Adv. Nurs. Prac. Teritary Care.
    """
    return capwords(' '.join(title.split()[2:]))

def parse_ottawa():
  OttawaParser('F').parse_courses()
  OttawaParser('S').parse_courses()

if __name__ == '__main__':
  if len(sys.argv) < 2:
    parse_ottawa()
  else:
    if sys.argv[1] not in ['F', 'S']:
      print "Please specify either F or S for semester"
    else:
      ott = OttawaParser(sys.argv[1])
      ott.parse_courses()