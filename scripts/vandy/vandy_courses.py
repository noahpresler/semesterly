# @what	Vanderbilt Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	9/3/16

import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

class VandyParser:

	def __init__(self, sem="Fall 2016"):
		self.session = requests.Session()
		self.headers = {'User-Agent' : 'My User Agent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.school = 'vandy'
		self.semester = sem
		self.departments = {}
		self.course = {}

	def get_html(self, url, payload=''):
		html = None
		while html is None:
			try:
				r = self.session.get(
					url,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = True)

				if r.status_code == 200:
					html = r.text

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				print "Unexpected error: ", sys.exc_info()[0]
				continue

		return html.encode('utf-8')

	def parse(self):

		# Get a list of all the department codes
		departmentCodes = self.getDepartmentCodes()

		# Base URL to query database for classes at Vandy
		courseSearchURL='https://webapp.mis.vanderbilt.edu/more/SearchClassesExecute!search.action'

		# Create payload to request course list from server
		payload = {
			'searchCriteria.classStatusCodes':'O',
			'__checkbox_searchCriteria.classStatusCodes':'O',
			'searchCriteria.classStatusCodes':'W',
			'__checkbox_searchCriteria.classStatusCodes':'W',
			'searchCriteria.classStatusCodes':'C',
			'__checkbox_searchCriteria.classStatusCodes':'C',
		}

		for departmentCode in departmentCodes:

			print 'Parsing courses in \"' + self.departments[departmentCode] + '\"'

			# Construct payload with department code
			payload.update({'searchCriteria.subjectAreaCodes': departmentCode})

			# GET html for department course listings
			html = self.get_html(courseSearchURL, payload)

			# Parse courses in department
			self.parseCoursesInDepartment(html)

		# Final updates
		self.wrap_up()

	def wrap_up(self):
			update_object, created = Updates.objects.update_or_create(
					school=self.school,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
			)
			update_object.save()

	def create_course(self):

		courseModel, course_was_created = Course.objects.update_or_create(
			code = self.course.get('code'),
			school = 'vandy',
			campus = 1,
			defaults = {
				'name': self.course.get('name'),
				'description': self.course.get('description') + '\n' + self.course.get('Notes'),
				'areas': self.course.get('Attributes'),
				'prerequisites': self.course.get('Requirement(s)'),
				'num_credits': float(self.course.get('Hours')),
				'level': '0',
				'department': self.departments.get(self.course.get('department'))
			}
		)

		return courseModel

	def create_section(self, courseModel):

		section, section_was_created = Section.objects.update_or_create(
			course = courseModel,
			semester = 'F', #self.semester[0].upper(),
			meeting_section = '(' + self.course.get('section') + ')',
			defaults = {
				'instructors': self.course.get('Instructor(s)') or '',
				'size': int(self.course.get('Class Capacity')),
				'enrolment': int(self.course.get('Total Enrolled'))
			}
		)

		return section

	def create_offerings(self, sectionModel):

		offeringModels = []

		if self.course.get('days'):
			for day in list(self.course.get('days')):
				offeringModel, offering_was_created = Offering.objects.update_or_create(
					section = sectionModel,
					day = day,
					time_start = self.course.get('time_start'),
					time_end = self.course.get('time_end'),
					defaults = {
						'location': 'unknown'
					}
				)

				offeringModels.append(offeringModel)

		return offeringModels

	def print_course(self):
		print ""
		for key in self.course:
			if self.course[key]:
				try:
					print key + "::" + self.course[key] + '::'
				except:
					sys.stderr.write("UNICODE ERROR\n")

	def update_current_course(self, label, value):
		self.course[label.encode('utf-8')] = value.encode('utf-8')

	def getDepartmentCodes(self):

		# Query Vandy class search website
		html = self.get_html('https://webapp.mis.vanderbilt.edu/more/SearchClasses!input.action')
		soup = BeautifulSoup(html, 'html.parser')

		# Retrieve all deparments from dropdown in advanced search
		departmentEntries = soup.find_all(id=re.compile("subjAreaMultiSelectOption[0-9]"))

		# Extract department codes from parsed department entries
		departmentCodes = [de['value'] for de in departmentEntries]

		for de in departmentEntries:
			self.departments[de['value']] = de['title']
		# change to list comprehension

		return departmentCodes

	def parseCoursesInDepartment(self, html):

		# Check number of results isn't over max
		numHitsSearch = re.search("totalRecords: ([0-9]*),", html)

		numHits = 0
		if numHitsSearch is not None:
			numHits = int(numHitsSearch.group(1))

		# perform more targeted searches if needed
		if numHits == 300:
			self.parseByDay(courseSearchURL, payload)
		else:
			self.parseSetOfCourses(html)

	def parseByDay(self, courseSearchURL, payload):

		# NOTE: Assuming no department will offer over 300 courses on MWF and TTHSS, individually
		# FIXME -- dangerous assumption to make!

		sys.stderr.write("ERROR: DEALING WITH TOO MANY COURSES IN DEPARTMENT")

		self.unsetDaysInPayload(payload)

		# parse Monday
		payload.update({
			'searchCriteria.meetingDays.onMonday':'true',
			'__checkbox_searchCriteria.meetingDays.onMonday':'true',	
			'searchCriteria.meetingDays.onWednesday':'true',
			'__checkbox_searchCriteria.meetingDays.onWednesday':'true',
			'searchCriteria.meetingDays.onFriday':'true',
			'__checkbox_searchCriteria.meetingDays.onFriday':'true',	
		})

		html = self.get_html(courseSearchURL, payload)
		num = int(re.search("totalRecords: ([0-9]*),", html).group(1))

		if num < 300:
			self.parseSetOfCourses(html)
		else:
			sys.stderr.write("ERROR: too many course offerings in " + payload['searchCriteria.subjectAreaCodes'] + " to parse accurately")

		self.unsetDaysInPayload(payload)

		# parse Tuesday
		payload.update({
			'searchCriteria.meetingDays.onTuesday':'true',
			'__checkbox_searchCriteria.meetingDays.onTuesday':'true',	
			'searchCriteria.meetingDays.onThursday':'true',
			'__checkbox_searchCriteria.meetingDays.onThursday':'true',
			'searchCriteria.meetingDays.onSaturday':'true',
			'__checkbox_searchCriteria.meetingDays.onSaturday':'true',	
			'searchCriteria.meetingDays.onSunday':'true',
			'__checkbox_searchCriteria.meetingDays.onSunday':'true',
		})

		html = self.get_html(courseSearchURL, payload)
		num = int(re.search("totalRecords: ([0-9]*),", html).group(1))

		if num < 300:
			self.parseSetOfCourses(html)
		else:
			sys.stderr.write("ERROR: too many course offerings in " + payload['searchCriteria.subjectAreaCodes'] + " to parse accurately")

		self.removeDaysInPayload(payload)

	def unsetDaysInPayload(self, payload):
		payload.update({
			'searchCriteria.meetingDaysOperation':'ANY',
			'searchCriteria.meetingDays.onMonday':'false',
			'__checkbox_searchCriteria.meetingDays.onMonday':'false',
			'__checkbox_searchCriteria.meetingDays.onTuesday':'false',
			'searchCriteria.meetingDays.onWednesday':'false',
			'__checkbox_searchCriteria.meetingDays.onWednesday':'false',
			'searchCriteria.meetingDays.onThursday':'false',
			'__checkbox_searchCriteria.meetingDays.onThursday':'false',
			'searchCriteria.meetingDays.onFriday':'false',
			'__checkbox_searchCriteria.meetingDays.onFriday':'false',
			'searchCriteria.meetingDays.onSaturday':'false',
			'__checkbox_searchCriteria.meetingDays.onSaturday':'false',
			'searchCriteria.meetingDays.onSunday':'false',
			'__checkbox_searchCriteria.meetingDays.onSunday':'false',
		})

	def removeDaysInPayload(self, payload):
		payload.pop('searchCriteria.meetingDaysOperation', None)
		payload.pop('searchCriteria.meetingDays.onMonday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onMonday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onTuesday', None)
		payload.pop('searchCriteria.meetingDays.onWednesday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onWednesday', None)
		payload.pop('searchCriteria.meetingDays.onThursday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onThursday', None)
		payload.pop('searchCriteria.meetingDays.onFriday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onFriday', None)
		payload.pop('searchCriteria.meetingDays.onSaturday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onSaturday', None)
		payload.pop('searchCriteria.meetingDays.onSunday', None)
		payload.pop('__checkbox_searchCriteria.meetingDays.onSunday', None)

	def parseSetOfCourses(self, html):

		prevCourseNumber = 0
		pageCount = 1

		while True:
			
			# Parse page by page
			lastClassNumber = self.parsePageOfCourses(html)
	
			# FIXME -- this will always print out ONE repeat for each set of courses

			# Condition met when reached last page
			if lastClassNumber != prevCourseNumber:
				pageCount = pageCount + 1
				nextPageURL = "https://webapp.mis.vanderbilt.edu/more/SearchClassesExecute!switchPage.action?pageNum=" + str(pageCount)
				html = self.get_html(nextPageURL)
				prevCourseNumber = lastClassNumber

			else:
				break

	def parsePageOfCourses(self, html):

		# initial parse with Beautiful Soup
		soup = BeautifulSoup(html, 'html.parser')
		courses = soup.find_all('tr', {'class' : 'classRow'})

		lastClassNumber = 0
		for course in courses:
			lastClassNumber = self.parseCourse(course)

		return lastClassNumber

	def parseCourse(self, soup):
		
		# Extract course code and term number to generate access to more info
		details = soup.find('td', {'class', 'classSection'})['onclick']
	
		# Extract course number and term code
		search = re.search("showClassDetailPanel.fire\({classNumber : '([0-9]*)', termCode : '([0-9]*)',", details)

		courseNumber, termCode = search.group(1), search.group(2)


		# Base URL to retrieve detailed course info
		courseDetailsURL = 'https://webapp.mis.vanderbilt.edu/more/GetClassSectionDetail.action'

		# Create payload to request course from server
		payload = {
			'classNumber' : courseNumber,
			'termCode' : termCode
		}

		self.parseCourseDetails(self.get_html(courseDetailsURL, payload))

		# self.print_course()

		# Create models
		courseModel = self.create_course()
		sectionModel = self.create_section(courseModel)
		self.create_offerings(sectionModel)
		
		# Clear course map for next pass
		self.course.clear()

		# Return course number to track end of course pages
		return courseNumber

	def parseCourseDetails(self, html):

		# Soupify course details html
		soup = BeautifulSoup(html, 'html.parser')
		courseNameAndAbbreviation = soup.find(id='classSectionDetailDialog').find('h1').text

		# Extract course name and abbreviation details
		search = re.search("(.*):.*\n(.*)", soup.find(id='classSectionDetailDialog').find('h1').text)
		courseName, abbr = search.group(2), search.group(1)

		# Extract department code, catalog ID, and section number from abbreviation
		match = re.match("(.*)-(.*)-(.*)", abbr)
		departmentCode, catalogID, sectionNumber = match.group(1), match.group(2), match.group(3)

		self.update_current_course("name", courseName)
		self.update_current_course("code", departmentCode + '-' + catalogID)
		self.update_current_course("department", departmentCode)
		self.update_current_course("Catalog ID", catalogID)
		self.update_current_course("section", sectionNumber)

		# Deal with course details as subgroups seen on details page
		detailHeaders = soup.find_all('div', {'class' : 'detailHeader'})
		detailPanels = soup.find_all('div', {'class' : 'detailPanel'})

		# NOTE: there should be the same number of detail headers and detail panels
		assert(len(detailHeaders) == len(detailPanels))

		for i in range(len(detailHeaders)):

			# Extract header name
			header = detailHeaders[i].text.strip()

			# Choose parsing strategy dependent on header
			if header == "Details" or header == "Availability":
				self.parse_labeled_table(detailPanels[i])

			elif header == "Description":
				self.parse_description(detailPanels[i])

			elif header == "Notes":
				self.parse_notes(detailPanels[i])

			elif header == "Meeting Times":
				self.parse_meeting_times(detailPanels[i])

			elif header == "Cross Listings":
				pass

			elif header == "Attributes":
				self.parse_attributes(detailPanels[i])

			elif header == "Ad Hoc Meeting Times":
				pass

	def parse_attributes(self, soup):

		labels = [l.text.strip() for l in soup.find_all('div', {'class' : 'listItem'})]
		self.update_current_course("Attributes", ', '.join(labels))

	def parse_labeled_table(self, soup):

		# Gather all labeled table entries
		labels = soup.find_all('td', {'class' : 'label'})

		for label in labels:

			siblings = label.fetchNextSiblings()

			# Check if label value exists
			if len(siblings) != 0:

				# Extract pure label from html
				key = label.text[:-1].strip()

				# Extract label's value(s) [deals with multiline multi-values]
				values = [l for l in (line.strip() for line in siblings[0].text.splitlines()) if l]

				# Edge cases
				if key == "Books":
					# bookURL = re.search("new YAHOO.mis.student.PopUpOpener\('(.*)',", values[0])
					# values = [bookURL.group(1)]
					values = ["<long bn url>"]

				elif key == "Hours":

					try:
						float(values[0])
					except ValueError:
						# FIXME -- temporary hack for range of credits (ex: 1.0-3.0)
						values[0] = '0.0'

				self.update_current_course(key, ', '.join(values))

	def parse_meeting_times(self, soup):

		# Gather all labeled table entries
		labels = soup.find_all('th', {'class' : 'label'})

		values = []
		if len(labels) > 0:
			values = soup.find('tr', {'class' : 'courseHeader'}).fetchNextSiblings()[0].find_all('td')
		else:

			# Create empty times slots
			self.update_current_course('days', '')
			self.update_current_course('time_start', '')
			self.update_current_course('time_end', '')

		# NOTE: number of labels and values should be the same
		assert(len(labels) == len(values))

		for i in range(len(labels)):
			label = labels[i].text.strip()
			value = values[i].text.strip()
			if len(label) > 0 and len(value) > 0:

				if label == "Instructor(s)":
					self.update_current_course(label, ', '.join(self.extract_instructors(value)))

				elif label == "Time":
					self.parse_time_range(value)

				elif label == "Days":
					self.parse_days(value)

				else:
					self.update_current_course(label, value)


	def parse_days(self, unformatted_days):

		if unformatted_days == "TBA" or unformatted_days == "":
			self.update_current_course("days", "")
		else:
			self.update_current_course("days", unformatted_days)

	def parse_time_range(self, unformatted_time_range):

		if unformatted_time_range == "TBA" or unformatted_time_range == "":

			# Create empty time slots
			self.update_current_course('days', '')
			self.update_current_course('time_start', '')
			self.update_current_course('time_end', '')

		else:

			search = re.match("(.*) \- (.*)", unformatted_time_range)
			if search is not None:
				self.update_current_course('time_start', self.time_to_24(search.group(1)))
				self.update_current_course('time_end', self.time_to_24(search.group(2)))
			else:
				sys.stderr.write('ERROR: invalid time format')

	def time_to_24(self, time12):

		# Regex extract
		match = re.match("(\d*):(\d*)(.)", time12)

		# Transform to 24 hours
		minutes = match.group(2)
		hours = int(match.group(1))
		if match.group(3) == 'p':
			hours = (hours%12)+12

		# Return as string
		return str(hours) + ":" + str(minutes)

	def extract_instructors(self, string):

		instructors = string.splitlines()

		for i in range(len(instructors)):

			# Deal with instance of primary instructor
			search = re.match("(.*) \(Primary\)", instructors[i])
			if search is not None:
				instructors[i] = search.group(1)

		return instructors

	def parse_notes(self, soup):
		notes = [l for l in (p.strip() for p in soup.text.splitlines()) if l]
		self.update_current_course('Notes', '\n'.join(notes))

	def parse_description(self, soup):
		self.update_current_course('description', soup.text.strip())
		self.update_current_course('Notes', '')

def main():
	vp = VandyParser()
	vp.parse()

if __name__ == "__main__":
	main()