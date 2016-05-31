import sys
import re
import os
import requests, cookielib
import datetime
from bs4 import BeautifulSoup
from sys import argv
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

# suppress warnings for not verifying SSL certificate 
import warnings
warnings.filterwarnings("ignore")

def get_valid_time(time):
  """Take convert time to 24hr format and remove trailing am/pm."""
  if not time:
    return time
  if time[-2:] == 'am' or time[:2] == '12':
    return time[:-2]
  else:
    time = time[:-2]
    hour, minute = time.split(':')
    hour = int(hour) + 12
    return str(hour) + ':' + minute

def get_profs(profs):
  """Take a list of profs and return them as a string."""
  return ', '.join(map(shorten_name, list(set(profs))))

def shorten_name(prof):
  return prof[12:] if prof.startswith('Instructor: ')\
                          else prof

class umdSection:
  def __init__(self, sid, profs, day, start_time, end_time, building, room, total_seats, open_seats, waitlist):
    self.id = sid
    self.profs = profs
    self.day = day
    self.start_time = start_time
    self.end_time = end_time
    self.building = building
    self.room = room
    self.total_seats = total_seats
    self.open_seats = open_seats
    self.waitlist = waitlist

  def __str__(self):
    return (
      "ID: " + self.id + ", Prof: " + self.profs[0] + ", day: " + self.day + ", start time: " + self.start_time 
      + " , end time: " + self.end_time + ", building: " + self.building + ", room: " + self.room + " total seats: " + self.total_seats 
      + ", open_seats: " + self.open_seats + ", waitlist: " + self.waitlist
    )

class umdCourse:
  def __init__(self, cid, title, credits, department, description, cores, geneds):
    self.id = cid
    self.title = title
    self.credits = credits
    self.department = department
    self.description = description
    self.cores = cores
    self.geneds = geneds

  def desig_string(self):
    s = "Cores: "
    for core in self.cores:
      s += core + " "

    s += ", Gened: "

    for gened in self.geneds:
      s += gened + " "

    return s

  def __str__(self):
    return (
      "ID: " + self.id + ", title: " + self.title + ", credits: " + self.credits + ", department: " + self.department + "\nDescription: " + self.description 
      + "\nSection: " + str(self.sections[0]) + " , " + self.desig_string()
    )

class umd:

  def __init__(self):
    self.s = requests.Session()
    self.cookies = cookielib.CookieJar()
    self.headers = {
      'User-Agent': 'My User Agent 1.0'
    }
    self.base_url = "http://ntst.umd.edu/soc/"

  def find_content(self, div_class, parent):
    try: 
      return parent.find(class_=div_class).contents[0].strip()
    except:
      return ''

  def find_url(self, div_class, parent):
    try: 
      return parent.find(class_=div_class)['href']
    except:
      return ''       

  def find_cores(self, tag, parent):
    try: 
      cores = []
      core_div = parent.find(tag, text=re.compile(r"CORE:")).parent
      core_links = core_div.findAll("a")
      for core_link in core_links:
        cores.append(core_link.contents[0].strip())
      return cores
    except:
      return []

  def find_gens(self, div_class, parent):
    try: 
      gen_spans = parent.findAll(class_=div_class)
      geneds = []
      for gen_span in gen_spans:
        geneds.append(gen_span.find("a").contents[0].strip())
      return geneds
    except:
      return []

  def get_html(self, url):
    html = None
    while html is None:
      try:
        r = self.s.get(url,cookies=self.cookies,headers=self.headers,verify=False)
        if r.status_code == 200:
          html = r.text
      except (requests.exceptions.Timeout,
          requests.exceptions.ConnectionError):
        print "Unexpected error:", sys.exc_info()[0]
        
        continue
    return html.encode('utf-8')

  def get_departments(self, semester, year):
    """Get department in the specified semester in specified year."""
    semester_map = {"fall":"08", "spring":"01"}

    html = self.get_html(self.base_url)
    soup = BeautifulSoup(html,"html.parser")
    prefix_rows = soup.findAll(class_='course-prefix row')
    prefix_a_tags = []
    departments = {}
    for row in prefix_rows:
      prefix_a_tags.append(row.find('a'))
    for link in prefix_a_tags:
      spans = link.findAll('span')
      department_url = spans[0].string
      department_name = spans[1].string
      if semester == None or year == None:
        partial_url = department_url
      else:
        semester_month = semester_map[semester]
        partial_url = str(year) + semester_month + "/" + department_url
      departments[self.base_url + partial_url] = department_name
    return departments

  def get_sections(self, section_url, course_model, semester):
    html = self.get_html(section_url)
    soup = BeautifulSoup(html, "html.parser")
    container = soup.find(class_="sections-container")
    section_divs = container.findAll(class_="section")
    for div in section_divs:
      sid = self.find_content("section-id", div)

      instructors = []
      instructors_div = div.findAll(class_="section-instructor")
      for instructor_div in instructors_div:
        instructor_link = instructor_div.find("a")
        if instructor_link != None:
          instructors.append(instructor_link.contents[0].strip())
        else:
          instructors.append(instructor_div.contents[0].strip())

      day = self.find_content("section-days", div)
      start_time = self.find_content("class-start-time", div)
      end_time = self.find_content("class-end-time", div)
      building = self.find_content("building-code", div)
      room = self.find_content("class-room", div)
      total_seats = self.find_content("total-seats-count", div)
      open_seats = self.find_content("open-seats-count", div)
      waitlist = self.find_content("waitlist-count", div)
      
      section = umdSection(sid, instructors, day, start_time, end_time, building, room, total_seats, open_seats, waitlist)

      section_model, section_created = Section.objects.update_or_create(
                course = course_model,
                semester = semester,
                meeting_section = section.id,
                defaults = {
                    'instructors': get_profs(section.profs),
                    'size': section.total_seats,
                    'enrolment': int(section.total_seats) - int(section.open_seats)
                }
            )

      days = section.day.replace('Tu', 'T').replace('Th', 'R')
      for day in days:
        try:
          offering_model, OfferingCreated = Offering.objects.update_or_create(
              section = section_model,
              day = day,
              time_start = get_valid_time(section.start_time),
              time_end = get_valid_time(section.end_time),
              defaults = {
                  'location':section.building + section.room
              }
          )
        except:
          print meeting_section, day, time_start, section_data

  def get_courses(self, departments, semester='S'):
    semester = 'F' if semester == 'fall' else 'S'
    num_created, num_updated = 0, 0
    for department_url, department_name in departments.items():
      html = self.get_html(department_url)
      soup = BeautifulSoup(html, "html.parser")
      course_div = soup.findAll(class_="course")
      for c in course_div:
        cid = self.find_content("course-id", c)
        partial_url = self.find_url("toggle-sections-link", c)
        if (partial_url == ''):
          continue

        title = self.find_content("course-title", c)
        credits = self.find_content("course-min-credits", c)
        description = self.find_content("approved-course-text", c)

        cores = []
        cores = self.find_cores("span", c)

        geneds = []
        geneds = self.find_gens("course-subcategory", c)

        course = umdCourse(cid, title, credits, department_name, description, cores, geneds)

        level = re.findall(re.compile(r"^\D*(\d)"), course.id)[0] + "00"

        course_model, created = Course.objects.update_or_create(
            code = course.id,
            school = 'umd',
            campus = 1,
            defaults={
                'name': course.title,
                'description': course.description,
                'cores': ', '.join(course.cores),
                'geneds': ', '.join(course.geneds),
                'num_credits': int(course.credits),
                'level': level,
                'department': course.department
            }
        )

        action = "CREATED" if created else "UPDATED"
        print "{0} {1} ==> {2}".format(action, cid, title)
        num_created += created
        num_updated += 1 - created

        section_url = "http://ntst.umd.edu" + partial_url
        sections = self.get_sections(section_url, course_model, semester)

  def parse_courses(self, semester=None, year=None):
    departments = self.get_departments(semester, year)
    self.get_courses(departments, semester)

def parse_umd():
  """Parse courses for both semester of the current year."""
  year = str(datetime.datetime.now().year)
  u = umd()
  u.parse_courses("fall", year)
  u.parse_courses("spring", year)

if __name__ == '__main__':
  u = umd()

  # Get all courses from the specified year and semester
  if len(argv) < 2 or sys.argv[1] not in ['fall', 'spring']:
    print "please specify either fall or spring as semester"
  else:
    u.parse_courses(sys.argv[1], 2016)
