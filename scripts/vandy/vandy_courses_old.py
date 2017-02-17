# # @what	Vanderbilt Course Parser
# # @org	Semeseter.ly
# # @author	Michael N. Miller
# # @date	9/3/16

# import django, os, datetime
# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
# django.setup()
# from timetable.models import *
# from fake_useragent import UserAgent
# from bs4 import BeautifulSoup
# import requests, cookielib, re, sys

# class VandyParser:

# 	def __init__(self):
# 		self.session = requests.Session()
# 		self.headers = {'User-Agent' : 'My User Agent 1.0'}
# 		self.cookies = cookielib.CookieJar()
# 		self.school = 'vandy'
# 		self.semester = ''
# 		self.departments = {}
# 		self.username = '***REMOVED***'
# 		self.password = '***REMOVED***'
# 		self.url = 'https://webapp.mis.vanderbilt.edu/more'
# 		self.course = {
# 			'description' : '',
# 			'cancelled' : False
# 		}

# 	def get_html(self, url, payload=''):
# 		html = None
# 		while html is None:
# 			try:
# 				r = self.session.get(
# 					url,
# 					params = payload,
# 					cookies = self.cookies,
# 					headers = self.headers,
# 					verify = True
# 				)

# 				if r.status_code == 200:
# 					html = r.text

# 			except (requests.exceptions.Timeout,
# 				requests.exceptions.ConnectionError):
# 				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
# 				continue

# 		return html.encode('utf-8')

# 	def post_http(self, url, form, payload=''):

# 		try:
# 			post = self.session.post(
# 				url,
# 				data = form,
# 				params = payload,
# 				cookies = self.cookies,
# 				headers = self.headers,
# 				verify = True,
# 				# allow_redirects=False
# 			)

# 			return post
# 			# if r.status_code == 200:
# 				# post = r.text

# 			# print "POST: " + r.url

# 		except (requests.exceptions.Timeout,
# 			requests.exceptions.ConnectionError):
# 			sys.stderr.write("Unexpected error: " + sys.exc_info()[0])

# 		return None

# 	def login(self):

# 		print "Logging in..."

# 		login_url = 'https://login.mis.vanderbilt.edu'
		
# 		get_login_url = login_url + '/login'
# 		params = {
# 			'service' : self.url + '/j_spring_cas_security_check'
# 		}

# 		soup = BeautifulSoup(self.get_html(get_login_url, params), 'html.parser')

# 		post_suffix_url = soup.find('form', {'name' : 'loginForm'})['action']

# 		post_login_url = login_url + post_suffix_url

# 		sec_block = soup.find('input', {'name' : 'lt'})['value']

# 		login_info = {
# 			'username': '***REMOVED***',
# 			'password': 'Gainz!23',
# 			'lt': sec_block,
# 			'_eventId': 'submit',
# 			'submit': 'LOGIN'
# 		}

# 		self.post_http(login_url + post_suffix_url, login_info, params)

# 		# TODO - not sure if this is necessary but it works
# 		self.get_html(self.url + '/Entry.action')

# 	def parse(self):

# 		# Login to vandy course search site
# 		self.login()

# 		# FIXME - hack to deal with Fall 2016 & Spring 2017
# 		semester_codes = {'F' : '0875', 'S' : '0880'}

# 		for semester in semester_codes:

# 			print 'Parsing semester ' + semester

# 			# Load environment for targeted semester
# 			self.semester = semester
# 			self.get_html(self.url + '/SelectTerm!selectTerm.action', {'selectedTermCode' : semester_codes[semester]})
# 			self.get_html(self.url + '/SelectTerm!updateSessions.action')

# 			# Get a list of all the department codes
# 			department_codes = self.extract_department_codes()

# 			# Create payload to request course list from server
# 			payload = {
# 				'searchCriteria.classStatusCodes': ['O', 'W', 'C'],
# 				'__checkbox_searchCriteria.classStatusCodes':['O','W', 'C']
# 			}

# 			for department_code in department_codes:

# 				print 'Parsing courses in \"' + self.departments[department_code] + '\"'

# 				# Construct payload with department code
# 				payload.update({'searchCriteria.subjectAreaCodes': department_code})

# 				# GET html for department course listings
# 				html = self.get_html(self.url + '/SearchClassesExecute!search.action', payload)

# 				# Parse courses in department
# 				self.parse_courses_in_department(html)

# 			# return to search page for next iteration
# 			self.get_html(self.url + '/Entry.action')

# 		# Final updates
# 		self.wrap_up()

# 	def wrap_up(self):
# 			update_object, created = Updates.objects.update_or_create(
# 					school=self.school,
# 					update_field="Course",
# 					defaults={'last_updated': datetime.datetime.now()}
# 			)
# 			update_object.save()

# 	def create_course(self):

# 		course_model, course_was_created = Course.objects.update_or_create(
# 			code = self.course.get('code'),
# 			school = 'vandy',
# 			campus = 1,
# 			defaults = {
# 				'name': self.course.get('name'),
# 				'description': self.course.get('description') if self.course.get('description') else '',
# 				'areas': self.course.get('Attributes'),
# 				'prerequisites': self.course.get('Requirement(s)'),
# 				'num_credits': float(self.course.get('Hours')) if VandyParser.is_float(self.course.get('Hours')) else 0.0,
# 				'level': '0',
# 				'department': self.departments.get(self.course.get('department'))
# 			}
# 		)

# 		return course_model

# 	@staticmethod
# 	def is_float(f):
# 		try:
# 			float(f)
# 			return True
# 		except TypeError:
# 			return False

# 	def create_section(self, course_model):

# 		if self.course.get('cancelled'):

# 			if Section.objects.filter(course = course_model, meeting_section = self.course.get('section')).exists():
# 				s = Section.objects.get(course = course_model, meeting_section = self.course.get('section'))
# 				Offering.objects.filter(section = s).delete()
# 				s.delete()

# 			self.course['cancelled'] = False

# 			return None

# 		else:
# 			section, section_was_created = Section.objects.update_or_create(
# 				course = course_model,
# 				semester = self.semester,
# 				meeting_section = self.course.get('section'),
# 				defaults = {
# 					'instructors': self.course.get('Instructor(s)') or '',
# 					'size': int(self.course.get('Class Capacity')),
# 					'enrolment': int(self.course.get('Total Enrolled'))
# 				}
# 			)

# 			return section

# 	def create_offerings(self, section_model):

# 		if self.course.get('days'):
# 			for day in list(self.course.get('days')):
# 				offering_model, offering_was_created = Offering.objects.update_or_create(
# 					section = section_model,
# 					day = day,
# 					time_start = self.course.get('time_start'),
# 					time_end = self.course.get('time_end'),
# 					defaults = {
# 						'location': self.course.get('Location')
# 					}
# 				)

# 				# yield offering_model

# 	def print_course(self):

# 		for label in self.course:
# 			try:
# 				print label + "::" + self.course[label] + '::'
# 			except:
# 				sys.stderr.write("error: UNICODE ERROR\n")
# 				print sys.exc_info()[0]

# 	def update_current_course(self, label, value):
# 		try:
# 			# self.course[label.encode('utf-8')] = value.encode('utf-8').strip()
# 			self.course[label] = value.strip()
# 		except:
# 			print 'label:', label, sys.exc_info()[0]
# 			sys.stderr.write("UNICODE ERROR\n")

# 	def extract_department_codes(self):

# 		# Query Vandy class search website
# 		html = self.get_html(self.url + '/SearchClasses!input.action')
# 		soup = BeautifulSoup(html, 'html.parser')
# 		# print soup.prettify().encode('utf-8')
# 		# exit(1)

# 		# Retrieve all deparments from dropdown in advanced search
# 		department_entries = soup.find_all(id=re.compile("subjAreaMultiSelectOption[0-9]"))

# 		# Extract department codes from parsed department entries
# 		department_codes = [de['value'] for de in department_entries]

# 		for de in department_entries:
# 			self.departments[de['value']] = de['title']

# 		return department_codes

# 	def parse_courses_in_department(self, html):

# 		# Check number of results isn't over max
# 		numHitsSearch = re.search("totalRecords: ([0-9]*),", html)

# 		numHits = 0
# 		if numHitsSearch is not None:
# 			numHits = int(numHitsSearch.group(1))

# 		# perform more targeted searches if needed
# 		if numHits == 300:
# 			self.parseByDay(self.url + '/SearchClassesExecute!search.action', payload)
# 		else:
# 			self.parse_set_of_courses(html)

# 	def parse_set_of_courses(self, html):

# 		prev_course_number = 0
# 		page_count = 1

# 		while True:

# 			# Parse page by page
# 			last_class_number = self.parse_page_of_courses(html)

# 			# NOTE: this will always print out ONE repeat for each set of courses, but map will be fine

# 			# Condition met when reached last page
# 			if last_class_number != prev_course_number:
# 				page_count = page_count + 1
# 				nextPageURL = self.url + '/SearchClassesExecute!switchPage.action?pageNum=' + str(page_count)
# 				html = self.get_html(nextPageURL)
# 				prev_course_number = last_class_number

# 			else:
# 				break

# 	def parse_page_of_courses(self, html):

# 		# initial parse with Beautiful Soup
# 		soup = BeautifulSoup(html, 'html.parser')
# 		courses = soup.find_all('tr', {'class' : 'classRow'})

# 		last_class_number = 0
# 		for course in courses:

# 			# remove cancelled classes
# 			if course.find('a', {'class' : 'cancelledStatus'}):
# 				self.course['cancelled'] = True

# 			last_class_number = self.parse_course(course)

# 		return last_class_number

# 	def parse_course(self, soup):

# 		# Extract course code and term number to generate access to more info
# 		details = soup.find('td', {'class', 'classSection'})['onclick']

# 		# Extract course number and term code
# 		search = re.search("showClassDetailPanel.fire\({classNumber : '([0-9]*)', termCode : '([0-9]*)',", details)

# 		course_number, term_code = search.group(1), search.group(2)

# 		# Base URL to retrieve detailed course info
# 		course_details_url = self.url + '/GetClassSectionDetail.action'

# 		# Create payload to request course from server
# 		payload = {
# 			'classNumber' : course_number,
# 			'termCode' : term_code
# 		}
		
# 		try:
# 			self.parse_course_details(self.get_html(course_details_url, payload))
# 			# self.print_course()

# 			# Create models
# 			section_model = self.create_section(self.create_course())
# 			if section_model:
# 				self.create_offerings(section_model)

# 			# Clear course map for next pass
# 			self.course.clear()

# 			# Return course number to track end of course pages

# 		except ParseException:
# 			print 'invalid course, parse exception'

# 		return course_number

# 	def parse_course_details(self, html):

# 		# Soupify course details html
# 		soup = BeautifulSoup(html, 'html.parser')
# 		courseNameAndAbbreviation = soup.find(id='classSectionDetailDialog').find('h1').text

# 		# Extract course name and abbreviation details
# 		search = re.search("(.*):.*\n(.*)", soup.find(id='classSectionDetailDialog').find('h1').text)
# 		courseName, abbr = search.group(2), search.group(1)

# 		# Extract department code, catalog ID, and section number from abbreviation
# 		title = re.match("(\S*)-(\S*)-(\S*)", abbr)

# 		if not title:
# 			raise ParseException()

# 		departmentCode, catalogID, sectionNumber = title.group(1), title.group(2), title.group(3)
# 		print '\t-', departmentCode, catalogID, sectionNumber.strip(), '-'

# 		self.update_current_course("name", courseName)
# 		self.update_current_course("code", departmentCode + '-' + catalogID)
# 		self.update_current_course("department", departmentCode)
# 		self.update_current_course("Catalog ID", catalogID)
# 		self.update_current_course("section", '(' + sectionNumber.strip() + ')')

# 		# in case no description for course
# 		self.update_current_course('description', '')

# 		# Deal with course details as subgroups seen on details page
# 		detail_headers = soup.find_all('div', {'class' : 'detailHeader'})
# 		detail_panels = soup.find_all('div', {'class' : 'detailPanel'})

# 		# NOTE: there should be the same number of detail headers and detail panels
# 		assert(len(detail_headers) == len(detail_panels))

# 		for i in range(len(detail_headers)):

# 			# Extract header name
# 			header = detail_headers[i].text.strip()

# 			# Choose parsing strategy dependent on header
# 			if header == "Details" or header == "Availability":
# 				self.parse_labeled_table(detail_panels[i])

# 			elif header == "Description":
# 				self.parse_description(detail_panels[i])

# 			elif header == "Notes":
# 				self.parse_notes(detail_panels[i])

# 			elif header == "Meeting Times":
# 				self.parse_meeting_times(detail_panels[i])

# 			elif header == "Cross Listings":
# 				pass

# 			elif header == "Attributes":
# 				self.parse_attributes(detail_panels[i])

# 			elif header == "Ad Hoc Meeting Times":
# 				pass

# 	def parse_attributes(self, soup):

# 		labels = [l.text.strip() for l in soup.find_all('div', {'class' : 'listItem'})]
# 		self.update_current_course("Attributes", ', '.join(labels))

# 	def parse_labeled_table(self, soup):

# 		# Gather all labeled table entries
# 		labels = soup.find_all('td', {'class' : 'label'})

# 		for label in labels:

# 			siblings = label.find_next_siblings()

# 			# Check if label value exists
# 			if len(siblings) != 0:

# 				# Extract pure label from html
# 				key = label.text[:-1].strip()

# 				# Extract label's value(s) [deals with multiline multi-values]
# 				values = [l for l in (line.strip() for line in siblings[0].text.splitlines()) if l]

# 				# Edge cases
# 				if key == "Books":
# 					# bookURL = re.search("new YAHOO.mis.student.PopUpOpener\('(.*)',", values[0])
# 					# values = [bookURL.group(1)]
# 					values = ["<long bn url>"]

# 				elif key == "Hours":

# 					try:
# 						float(values[0])
# 					except ValueError:
# 						# FIXME -- temporary hack for range of credits (ex: 1.0-3.0)
# 						values[0] = '0.0'

# 				self.update_current_course(key, ', '.join(values))

# 	def parse_meeting_times(self, soup):

# 		# Gather all labeled table entries
# 		labels = soup.find_all('th', {'class' : 'label'})

# 		values = []
# 		if len(labels) > 0:
# 			values = soup.find('tr', {'class' : 'courseHeader'}).find_next_siblings()[0].find_all('td')
# 		else:

# 			# Create empty times slots
# 			self.update_current_course('days', '')
# 			self.update_current_course('time_start', '')
# 			self.update_current_course('time_end', '')

# 		# NOTE: number of labels and values should be the same
# 		assert(len(labels) == len(values))

# 		for i in range(len(labels)):
# 			label = labels[i].text.strip()
# 			value = values[i].text.strip()
# 			if len(label) > 0 and len(value) > 0:

# 				if label == "Instructor(s)":
# 					self.update_current_course(label, ', '.join(self.extract_instructors(value)))

# 				elif label == "Time":
# 					self.parse_time_range(value)

# 				elif label == "Days":
# 					self.parse_days(value)

# 				else:
# 					self.update_current_course(label, value)


# 	def parse_days(self, unformatted_days):

# 		if unformatted_days == "TBA" or unformatted_days == "":
# 			self.update_current_course("days", "")
# 		else:
# 			self.update_current_course("days", unformatted_days)

# 	def parse_time_range(self, unformatted_time_range):

# 		if unformatted_time_range == "TBA" or unformatted_time_range == "":

# 			# Create empty time slots
# 			self.update_current_course('days', '')
# 			self.update_current_course('time_start', '')
# 			self.update_current_course('time_end', '')

# 		else:

# 			search = re.match("(.*) \- (.*)", unformatted_time_range)
# 			if search is not None:
# 				self.update_current_course('time_start', self.time_12_to_24(search.group(1)))
# 				self.update_current_course('time_end', self.time_12_to_24(search.group(2)))
# 			else:
# 				sys.stderr.write('ERROR: invalid time format')

# 	def time_12_to_24(self, time12):

# 		# Regex extract
# 		match = re.match("(\d*):(\d*)(.)", time12)

# 		# Transform to 24 hours
# 		minutes = match.group(2)
# 		hours = int(match.group(1))
# 		if match.group(3) == 'p':
# 			hours = (hours%12)+12

# 		# Return as string
# 		return str(hours) + ":" + str(minutes)

# 	def extract_instructors(self, string):

# 		instructors = string.splitlines()

# 		for i in range(len(instructors)):

# 			# Deal with instance of primary instructor
# 			search = re.match("(.*) \(Primary\)", instructors[i])
# 			if search is not None:
# 				instructors[i] = search.group(1)

# 		return instructors

# 	def parse_notes(self, soup):
# 		notes = ' '.join([l for l in (p.strip() for p in soup.text.splitlines()) if l]).strip()
# 		self.update_current_course('description', self.course.get('description') + '\nNotes: ' + notes)

# 	def parse_description(self, soup):
# 		self.update_current_course('description', soup.text.strip())

# class ParseException(Exception):
# 	pass

# def main():
# 	vp = VandyParser()
# 	vp.parse()

# if __name__ == "__main__":
# 	main()
