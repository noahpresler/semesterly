import sys
import requests, cookielib
from bs4 import BeautifulSoup
import re


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
	def __init__(self, cid, title, credits, description, sections, cores, geneds):
		self.id = cid
		self.title = title
		self.credits = credits
		self.description = description
		self.sections = sections
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
			"ID: " + self.id + ", title: " + self.title + ", credits: " + self.credits + "\nDescription: " + self.description 
			+ "\nSection: " + str(self.sections[0]) + " , " + self.desig_string()
		)


class umd:

	def __init__(self):
		self.s = requests.Session()
		self.cookies = cookielib.CookieJar()
		self.headers = {
			'User-Agent': 'My User Agent 1.0'
		}
		self.base_url = "https://ntst.umd.edu/soc/"

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
				r = self.s.get(url,cookies=self.cookies,headers=self.headers, verify=False)
				if r.status_code == 200:
					html = r.text
			except (requests.exceptions.Timeout,
					requests.exceptions.ConnectionError):
				print "Unexpected error:", sys.exc_info()[0]
				
				continue
		return html.encode('utf-8')

	def get_departments(self):
		html = self.get_html("https://ntst.umd.edu/soc/")
		soup = BeautifulSoup(html,"html.parser")
		prefix_rows = soup.findAll(class_='course-prefix row')
		prefix_a_tags = []
		department_urls = []
		for row in prefix_rows:
			prefix_a_tags.append(row.find('a'))
		for link in prefix_a_tags:
			department_urls.append("https://ntst.umd.edu/soc/" + link['href'])
		return department_urls

	def get_sections(self, section_url):
		html = self.get_html(section_url)
		soup = BeautifulSoup(html, "html.parser")
		sections = []
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
			
			sections.append(umdSection(sid, instructors, day, start_time, end_time, building, room, total_seats, open_seats, waitlist))

		return sections


	def get_courses(self, department_urls):
		for department_url in department_urls:
			html = self.get_html(department_url)
			soup = BeautifulSoup(html, "html.parser")
			course_div = soup.findAll(class_="course")
			courses = []
			for c in course_div:
				cid = self.find_content("course-id", c)
				print(cid)
				partial_url = self.find_url("toggle-sections-link", c)
				if (partial_url == ''):
					continue
				section_url = "https://ntst.umd.edu" + partial_url
				sections = self.get_sections(section_url)
				title = self.find_content("course-title", c)
				credits = self.find_content("course-min-credits", c)
				description = self.find_content("approved-course-text", c)

				cores = []
				cores = self.find_cores("span", c)

				geneds = []
				geneds = self.find_gens("course-subcategory", c)

				courses.append(umdCourse(cid, title, credits, description, sections, cores, geneds))
		return courses


	def parse_courses(self):
		department_urls = self.get_departments()
		courses = self.get_courses(department_urls)
		return courses



u = umd()
u.parse_courses()
#print(u.get_sections("https://ntst.umd.edu/soc/201601/ECON/ECON454"))

