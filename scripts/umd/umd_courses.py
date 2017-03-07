from __future__ import print_function # NOTE: slowly move toward Python3
import sys, re
from scripts.parser_library.BaseParser import CourseParser

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
  return prof[12:] if prof.startswith('Instructor: ') else prof

class UMDParser(CourseParser):
  def __init__(self, sem="Spring", year="2017", **kwargs):
    # CourseParser.__init__(self, school)
    self.semester = sem
    self.year = year
    self.last_course = {}
    self.last_section = {}
    self.base_url = "http://ntst.umd.edu/soc/"
    super(UMDParser, self).__init__('umd',**kwargs)

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

  def get_departments(self):
    """Get department in the specified semester in specified year."""
    # HARD CODED
    semester_map = {"Fall":"08", "Spring":"01"}

    soup = self.requester.get(url=self.base_url)
    prefix_rows = soup.findAll(class_='course-prefix row')
    prefix_a_tags = []
    departments = {}
    for row in prefix_rows:
      prefix_a_tags.append(row.find('a'))
    for link in prefix_a_tags:
      spans = link.findAll('span')
      department_url = spans[0].string
      department_name = spans[1].string
      if self.semester == None or self.year == None:
        partial_url = department_url
      else:
        semester_month = semester_map[self.semester]
        partial_url = str(self.year) + semester_month + "/" + department_url
      departments[self.base_url + partial_url] = department_name
    return departments

  def get_courses(self, departments):
    num_created, num_updated = 0, 0
    for department_url, department_name in departments.items():
      soup = self.requester.get(url=department_url)
      course_div = soup.findAll(class_="course")
      for c in course_div:
        cid = self.find_content("course-id", c)
        partial_url = self.find_url("toggle-sections-link", c)
        if (partial_url == ''):
          continue

        name = self.find_content("course-title", c)
        credits = int(self.find_content("course-min-credits", c))
        description = self.find_content("approved-course-text", c)

        cores = []
        cores = self.find_cores("span", c)

        geneds = []
        geneds = self.find_gens("course-subcategory", c)

        level = re.findall(re.compile(r"^\D*(\d)"), cid)[0] + "00"

        self.ingestor['cores'] = cores
        self.ingestor['geneds'] = geneds
        self.ingestor['level'] = level
        self.ingestor['name'] = name
        self.ingestor['description'] = description
        self.ingestor['code'] = cid
        self.ingestor['num_credits'] = credits
        self.ingestor['department_name'] = department_name
        self.ingestor['campus'] = 1

        course_model = self.ingestor.ingest_course()

        section_url = "http://ntst.umd.edu" + partial_url
        sections = self.get_sections(section_url, course_model)

  def get_sections(self, section_url, course_model):
    soup = self.requester.get(url=section_url)
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
      
      self.ingestor['section'] = sid
      self.ingestor['semester'] = self.semester
      self.ingestor['instructors'] = instructors
      self.ingestor['capacity'] = int(total_seats)
      self.ingestor['enrollment'] = int(total_seats) - int(open_seats)
      self.ingestor['waitlist'] = int(waitlist)
      self.ingestor['year'] = self.year

      section_model = self.ingestor.ingest_section(course_model)

      days = day.replace('Tu', 'T').replace('Th', 'R')
      valid_days = set(["M", "T", "W", "R", "F", "S", "U"])
      for day in days:
        if day not in valid_days or not start_time or not end_time:
          continue
        self.ingestor['day'] = day
        self.ingestor['time_start'] = get_valid_time(start_time)
        self.ingestor['time_end'] = get_valid_time(end_time)
        self.ingestor['location'] = building + room
        meeting_model = self.ingestor.ingest_offerings(section_model)


  def start(self,
        years=None,
        terms=None,
        department=None,
        textbooks=True,
        verbosity=3,
        **kwargs):
    if department:
      print("Error: Departments inputs are not supported.", file=sys.stderr)
    if years and terms:
      for year, term in years:
        self.year = year
        for term in terms:
          self.term = term
          departments = self.get_departments()
          self.get_courses(departments)
    else:
      departments = self.get_departments()
      self.get_courses(departments)      
    self.ingestor.wrap_up()

if __name__ == '__main__':
  parser = UMDParser()
  parser.start()