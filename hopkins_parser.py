from selenium import webdriver
from time import sleep
import json
import requests, cookielib
import os
import sys
import django
from toolz import itertoolz
from collections import OrderedDict
import re
from bs4 import BeautifulSoup
from selenium.webdriver.support.ui import Select
from timetable.models import *
import urllib2
from fake_useragent import UserAgent

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
WEBDRIVER_CHROME = None # e.g. '/home/linoah/chromedriver'
#=====================================================================================================

django.setup()

class HopkinsCourseFinder:

	def safe_print(self,to_print):
		try:
			print to_print
		except UnicodeEncodeError:
			print "Print statement omitted for UnicodeEncodeError."

	def __init__(self):
		
		self.html = None
		self.soup = None
		self.detail_html = None
		self.deatil_soup = None

		self.course_updates = 0
		self.course_creates = 0
		self.offering_updates = 0
		self.offering_creates = 0

		self.s = requests.Session()
		self.cookies = cookielib.CookieJar()
		self.headers = {
			'User-Agent': 'My User Agent 1.0'
		}

		if len(sys.argv) != 2 or (sys.argv[1] != "spring" and sys.argv[1] != "fall"):
			self.safe_print("You must supply a semester either spring or fall to parse.")
			exit()
		elif len(sys.argv) == 2: 
			self.semester = str(sys.argv[1])
		self.safe_print("Parsing Data For: " + self.semester + " Semester")
		if not WEBDRIVER_CHROME:
			self.driver = webdriver.Chrome()
		else: 
			self.driver = webdriver.Chrome(WEBDRIVER_CHROME)
		self.driver.get("https://isis.jhu.edu/classes/")
		sleep(1)
		if self.semester == "spring":
			while True:
				try: 
					selector = Select(self.driver.find_element_by_id("ctl00_content_lbTerms"))
					selector.deselect_all()
					selector.select_by_value("Spring 2016")
					break
				except:
					self.safe_print("Waiting for page load")
					sleep(.5)
		self.safe_print("Term Has Been Selected")
		self.driver.find_element_by_id("ctl00_content_btnSearch").click()
		while True:
			try: 
				selector = Select(self.driver.find_element_by_id("ctl00_content_ddlResultsPerPage"))
				selector.select_by_value("100")
				break
			except:
				self.safe_print("Waiting for page load")
				sleep(.5)

	def parse_classes(self):
		while self.driver.current_url != "https://isis.jhu.edu/classes/error.htm":
			self.html = self.driver.page_source
			self.soup = BeautifulSoup(self.html)
			odd_class_rows = self.soup.findAll('tr', class_="odd")
			even_class_rows = self.soup.findAll('tr', class_="even")
			class_rows = self.merge_lists(even_class_rows,odd_class_rows) 
			self.generate_courses(class_rows)
			self.driver.execute_script("__doPostBack('ctl00$content$ucPageNumbersBottom$lbNext','')")
		self.safe_print("Courses: [" + str(self.course_updates) + "/" + str(self.course_creates) + "] [Updated/Created]")
		self.safe_print("Offerings: [" + str(self.offering_updates) + "/" + str(self.offering_creates) + "] [Updated/Created]")

	def get_detail_html(self, url):
		html = None
		while html is None:
			try:
				# self.randomize_ua()
				r = self.s.get(url,cookies=self.cookies,headers=self.headers)
				if r.status_code == 200:
					html = r.text
			except (requests.exceptions.Timeout,
					requests.exceptions.ConnectionError):
				continue
		return html.encode('utf-8')

	def generate_courses(self, course_rows):
		for row in course_rows:
			pieces = row.findAll('td')
			school_name = self.get_school_name(pieces).text
			class_number = self.get_class_number(pieces).text
			section_number = re.search(r"\(([A-Za-z0-9_.]+)\)",class_number)
			course_code = class_number[:-1*len(section_number.group(0))]
			section_code = section_number.group(0)
			class_term = self.get_class_term(pieces).text
			raw_class_time = self.get_class_times(pieces).text
			time_data = self.process_times(raw_class_time)
			detail_id = row.find('a', {"id": re.compile('blah_\d+')}).get('id')[5:]
			detail_html = self.get_detail_html("https://isis.jhu.edu/classes/ClassDetails.aspx?id=" + detail_id)
			details = BeautifulSoup(detail_html)
			class_location = self.get_class_location(details)
			class_instructors = self.get_class_instructors(pieces).text.replace('\n', '')
			class_description = self.get_class_description(details)
			class_name = self.get_class_name(pieces)

			course, CourseCreated = HopkinsCourse.objects.get_or_create(
				code=course_code,
				campus=1)
			course.name=class_name
			course.description=class_description
			if CourseCreated:
				self.safe_print("CREATED " + course_code + " ==> " + class_name)
			else:
				course.save()
				self.safe_print("UPDATED " + course_code + " ==> " + class_name)
				self.course_updates+=1

			# get the textbooks for this course before deleting the course offerings
			cos = HopkinsCourseOffering.objects.filter(
				course=course,
				semester=self.semester[0].upper(),
				meeting_section=section_code)
			links = []
			for co in cos:
				links += HopkinsLink.objects.filter(courseoffering=co)
			cos.delete()

			for time in time_data:
				offering, OfferingCreated = HopkinsCourseOffering.objects.get_or_create(
					course=course,
					semester=self.semester[0].upper(),
					meeting_section=section_code,
					day=time['day'],
					time_start=time['start'],
					time_end=time['end'],
					instructors=class_instructors)
				offering.save()
				for l in links:
					l.courseoffering = offering
					l.save()
				offering.save()
				offering.location='' #TODO
				offering.size=0     #TODO
				offering.enrolment=0    #TODO
				if OfferingCreated:
					self.offering_creates+=1
				else:
					self.offering_updates+=1



	def process_times(self,class_time):
		day_to_letter_map = {'m': 'M', 
			't': 'T', 
			'w': 'W',

			'th': 'R',
			'f': 'F',
			'sa': 'S',
			's': 'U'}

		time_data = []
		for time in class_time.split(','):
			if len(time) > 0:
				time_pieces = re.search(r"([^\s]+)\s(\d?\d):(\d\d)([AP])M\s-\s(\d?\d):(\d\d)([AP])M",time)

				#Regex:______________________________
				#   |           |                   |
				#   |  Groups # |      Function     |
				#   |___________|___________________|
				#   |   1       |       Day         |
				#   |   2       |    Start Hour     |
				#   |   3       |    Start Minute   |
				#   |   4       |  Start A/P (AM/PM)|
				#   |   5       |     End Hour      |
				#   |   6       |   End Minutes     |
				#   |   7       |  End A/P (AM/PM)  |
				#   |_______________________________|
				#

				hours = [None] * 2
				start_hour = int(time_pieces.group(2))
				end_hour = int(time_pieces.group(5))
				if time_pieces.group(4).upper() == "P" and time_pieces.group(2) != "12":
					start_hour += 12
				if time_pieces.group(7).upper() == "P" and time_pieces.group(5) != "12":
					end_hour += 12
				hours[0] = str(start_hour) + ":" + time_pieces.group(3)
				hours[1] = str(end_hour) + ":" + time_pieces.group(6)
				duration = (end_hour) - (start_hour) #TODO: FIX THIS
				days = time_pieces.group(1)
				if days != "TBA" and days !="None":
					for day_letter in re.findall(r"([A-Z][a-z]*)+?",days):
						day = day_to_letter_map[day_letter.lower()]
						time_data.append(OrderedDict([
							("day", day),
							("start", hours[0]),
							("end", hours[1]),
							("duration", ""),
							("location", "TODO")
					]))
		return time_data

	def merge_lists(self, evens,odds):
		courses = []
		while evens:
			if odds:
				courses.insert(0,odds.pop())
			courses.insert(0,evens.pop())

		if odds:
			courses.insert(0,odds.pop())
		return courses

	def get_class_name(self, td):
		 return td[2].text.replace('\n', '').rstrip().replace('[+]','').strip()

	def get_school_name(self, td):
		return td[0]

	def get_class_number(self, td):
		return td[1]

	def get_class_term(self, td):
		return td[3]

	def get_class_times(self, td):
		return td[5]

	def get_class_location(self, details):
		text = str(details)
		pattern = re.compile(r"^.*\|.*\|\s(.*)$", re.MULTILINE)
		matches = re.findall(pattern,text)
		return '/'.join(matches)

	def get_class_times(self, td):
		return td[5]

	def get_class_instructors(self, td):
		return td[6]

	def get_class_description(self, details):
		return details.find(id="sectionDetails_lblDescription").getText()

	def get_class_prereqs(self, details):
		return None #TODO

cf = HopkinsCourseFinder()
cf.parse_classes()