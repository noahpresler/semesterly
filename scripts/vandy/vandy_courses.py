# @what	    Vanderbilt Course Parser
# @org      Semeseter.ly
# @author   Michael N. Miller and Maxwell Yeo
# @date	    2/5/17
import sys, re
from scripts.parser_library.BaseParser import CourseParser

class VandyParser(CourseParser):

	API_URL = 'https://webapp.mis.vanderbilt.edu/more'

	def __init__(self, **kwargs):
		self.school = 'vandy'
		self.departments = {}
		self.username = '***REMOVED***'
		self.password = '***REMOVED***'
		self.course = {
			'description' : '',
			'cancelled' : False
		}
		super(VandyParser, self).__init__('vandy',**kwargs)

	def login(self):
		print "Logging in..."
		login_url = 'https://login.mis.vanderbilt.edu'
		get_login_url = login_url + '/login'
		params = {
			'service' : VandyParser.API_URL + '/j_spring_cas_security_check'
		}
		soup = self.requester.get(get_login_url, params)
		post_suffix_url = soup.find('form', {'name' : 'loginForm'})['action']
		post_login_url = login_url + post_suffix_url
		sec_block = soup.find('input', {'name' : 'lt'})['value']
		login_info = {
			'username': '***REMOVED***',
			'password': 'Gainz!23',
			'lt': sec_block,
			'_eventId': 'submit',
			'submit': 'LOGIN'
		}
		self.requester.post(login_url + post_suffix_url, login_info, params, parse=False)
		# TODO - not sure if this is necessary but it works
		self.requester.get(VandyParser.API_URL + '/Entry.action', parse=False)

	def start(self, **kwargs):
		self.parse()

	def parse(self):
		self.login()

		# FIXME - hack to deal with Fall 2016 & Spring 2017
		semester_codes = {
			'2016': {
				'F' : {
					'term_code':'0875',
					'name':'Fall'
				}
			},
			'2017': {
				'S' : {
					'term_code':'0880',
					'name':'Spring'
				}
			}
		}

		for year in semester_codes:

			print 'Parsing year ' + year
			self.ingestor['year'] = year

			for semester in semester_codes[year]:

				print 'Parsing semester ' + semester
				self.ingestor['semester'] = semester_codes[year][semester]['name']

				# Load environment for targeted semester
				self.requester.get(VandyParser.API_URL + '/SelectTerm!selectTerm.action', {'selectedTermCode' : semester_codes[year][semester]['term_code']}, parse=False)
				self.requester.get(VandyParser.API_URL + '/SelectTerm!updateSessions.action', parse=False)

				# Get a list of all the department codes
				department_codes = self.extract_department_codes()

				# Create payload to request course list from server
				payload = {
					'searchCriteria.classStatusCodes': ['O', 'W', 'C'],
					'__checkbox_searchCriteria.classStatusCodes':['O','W', 'C']
				}

				for department_code in department_codes:

					print 'Parsing courses in \"' + self.departments[department_code] + '\"'

					# Construct payload with department code
					payload.update({'searchCriteria.subjectAreaCodes': department_code})

					# GET html for department course listings
					html = self.requester.get(VandyParser.API_URL + '/SearchClassesExecute!search.action', payload)

					# Parse courses in department
					self.parse_courses_in_department(html)

				# return to search page for next iteration
				self.requester.get(VandyParser.API_URL + '/Entry.action', parse=False)

	def create_course(self):
		self.ingestor['school'] = 'vandy'
		self.ingestor['campus'] = 1
		self.ingestor['code'] = self.course.get('code')
		self.ingestor['name'] = self.course.get('name')
		self.ingestor['description'] = self.course.get('description') if self.course.get('description') else ''
		self.ingestor['num_credits'] = float(self.course.get('Hours')) if VandyParser.is_float(self.course.get('Hours')) else 0.0
		self.ingestor['areas'] = filter(lambda a: a != None, self.course.get('Attributes').split(',')) if self.course.get('Attributes') != None else None
		self.ingestor['prerequisites'] = self.course.get('Requirement(s)')
		self.ingestor['department_name'] = self.departments.get(self.course.get('department'))
		self.ingestor['level'] = '0'

		created_course = self.ingestor.ingest_course()
		return created_course

	@staticmethod
	def is_float(f):
		try:
			float(f)
			return True
		except TypeError:
			return False

	def create_section(self, created_course):
		if self.course.get('cancelled'):
			self.course['cancelled'] = False
			return None

		else:
			self.ingestor['section'] = self.course.get('section')
			self.ingestor['instructors'] = self.course.get('Instructor(s)') or ''
			self.ingestor['size'] = int(self.course.get('Class Capacity'))
			self.ingestor['enrolment'] = int(self.course.get('Total Enrolled'))

			created_section = self.ingestor.ingest_section(created_course)
			return created_section

	def create_offerings(self, created_section):
		if self.course.get('days'):
			for day in list(self.course.get('days')):
				self.ingestor['day'] = day
				self.ingestor['time_start'] = self.course.get('time_start')
				self.ingestor['time_end'] = self.course.get('time_end')
				self.ingestor['location'] = self.course.get('Location')

				created_meeting = self.ingestor.ingest_offerings(created_section)
				# yield offering_model

	def print_course(self):

		for label in self.course:
			try:
				print label + "::" + self.course[label] + '::'
			except:
				sys.stderr.write("error: UNICODE ERROR\n")
				print sys.exc_info()[0]

	def update_current_course(self, label, value):
		try:
			# self.course[label.encode('utf-8')] = value.encode('utf-8').strip()
			self.course[label] = value.strip()
		except:
			print 'label:', label, sys.exc_info()[0]
			sys.stderr.write("UNICODE ERROR\n")

	def extract_department_codes(self):

		# Query Vandy class search website
		soup = self.requester.get(VandyParser.API_URL + '/SearchClasses!input.action', parse=True)
		# print soup.prettify().encode('utf-8')
		# exit(1)

		# Retrieve all deparments from dropdown in advanced search
		department_entries = soup.find_all(id=re.compile("subjAreaMultiSelectOption[0-9]"))

		# Extract department codes from parsed department entries
		department_codes = [de['value'] for de in department_entries]

		for de in department_entries:
			self.departments[de['value']] = de['title']

		return department_codes

	def parse_courses_in_department(self, html):

		# Check number of results isn't over max
		numHitsSearch = re.search("totalRecords: ([0-9]*),", str(html))

		numHits = 0
		if numHitsSearch is not None:
			numHits = int(numHitsSearch.group(1))

		# perform more targeted searches if needed
		if numHits == 300:
			self.parseByDay(VandyParser.API_URL + '/SearchClassesExecute!search.action', payload)
		else:
			self.parse_set_of_courses(html)

	def parse_set_of_courses(self, html):

		prev_course_number = 0
		page_count = 1

		while True:

			# Parse page by page
			last_class_number = self.parse_page_of_courses(html)

			# NOTE: this will always print out ONE repeat for each set of courses, but map will be fine

			# Condition met when reached last page
			if last_class_number != prev_course_number:
				page_count = page_count + 1
				nextPageURL = VandyParser.API_URL + '/SearchClassesExecute!switchPage.action?pageNum=' + str(page_count)
				html = self.requester.get(nextPageURL)
				prev_course_number = last_class_number

			else:
				break

	def parse_page_of_courses(self, html):

		# initial parse with Beautiful Soup
		courses = html.find_all('tr', {'class' : 'classRow'})

		last_class_number = 0
		for course in courses:

			# remove cancelled classes
			if course.find('a', {'class' : 'cancelledStatus'}):
				self.course['cancelled'] = True

			last_class_number = self.parse_course(course)

		return last_class_number

	def parse_course(self, soup):

		# Extract course code and term number to generate access to more info
		details = soup.find('td', {'class', 'classSection'})['onclick']

		# Extract course number and term code
		search = re.search("showClassDetailPanel.fire\({classNumber : '([0-9]*)', termCode : '([0-9]*)',", details)

		course_number, term_code = search.group(1), search.group(2)

		# Base URL to retrieve detailed course info
		course_details_url = VandyParser.API_URL + '/GetClassSectionDetail.action'

		# Create payload to request course from server
		payload = {
			'classNumber' : course_number,
			'termCode' : term_code
		}
		
		try:
			self.parse_course_details(self.requester.get(course_details_url, payload))
			# self.print_course()

			# Create models
			created_section = self.create_section(self.create_course())
			if created_section:
				self.create_offerings(created_section)

			# Clear course map for next pass
			self.course.clear()

			# Return course number to track end of course pages

		except ParseException:
			print 'invalid course, parse exception'

		return course_number

	def parse_course_details(self, html):

		# Soupify course details html
		courseNameAndAbbreviation = html.find(id='classSectionDetailDialog').find('h1').text

		# Extract course name and abbreviation details
		search = re.search("(.*):.*\n(.*)", html.find(id='classSectionDetailDialog').find('h1').text)
		courseName, abbr = search.group(2), search.group(1)

		# Extract department code, catalog ID, and section number from abbreviation
		title = re.match("(\S*)-(\S*)-(\S*)", abbr)

		if not title:
			raise ParseException()

		departmentCode, catalogID, sectionNumber = title.group(1), title.group(2), title.group(3)
		print '\t-', departmentCode, catalogID, sectionNumber.strip(), '-'

		self.update_current_course("name", courseName)
		self.update_current_course("code", departmentCode + '-' + catalogID)
		self.update_current_course("department", departmentCode)
		self.update_current_course("Catalog ID", catalogID)
		self.update_current_course("section", '(' + sectionNumber.strip() + ')')

		# in case no description for course
		self.update_current_course('description', '')

		# Deal with course details as subgroups seen on details page
		detail_headers = html.find_all('div', {'class' : 'detailHeader'})
		detail_panels = html.find_all('div', {'class' : 'detailPanel'})

		# NOTE: there should be the same number of detail headers and detail panels
		assert(len(detail_headers) == len(detail_panels))

		for i in range(len(detail_headers)):

			# Extract header name
			header = detail_headers[i].text.strip()

			# Choose parsing strategy dependent on header
			if header == "Details" or header == "Availability":
				self.parse_labeled_table(detail_panels[i])

			elif header == "Description":
				self.parse_description(detail_panels[i])

			elif header == "Notes":
				self.parse_notes(detail_panels[i])

			elif header == "Meeting Times":
				self.parse_meeting_times(detail_panels[i])

			elif header == "Cross Listings":
				pass

			elif header == "Attributes":
				self.parse_attributes(detail_panels[i])

			elif header == "Ad Hoc Meeting Times":
				pass

	def parse_attributes(self, soup):

		labels = [l.text.strip() for l in soup.find_all('div', {'class' : 'listItem'})]
		self.update_current_course("Attributes", ', '.join(labels))

	def parse_labeled_table(self, soup):

		# Gather all labeled table entries
		labels = soup.find_all('td', {'class' : 'label'})

		for label in labels:

			siblings = label.find_next_siblings()

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
			values = soup.find('tr', {'class' : 'courseHeader'}).find_next_siblings()[0].find_all('td')
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
				self.update_current_course('time_start', self.time_12_to_24(search.group(1)))
				self.update_current_course('time_end', self.time_12_to_24(search.group(2)))
			else:
				sys.stderr.write('ERROR: invalid time format')

	def time_12_to_24(self, time12):

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
		notes = ' '.join([l for l in (p.strip() for p in soup.text.splitlines()) if l]).strip()
		self.update_current_course('description', self.course.get('description') + '\nNotes: ' + notes)

	def parse_description(self, soup):
		self.update_current_course('description', soup.text.strip())

class ParseException(Exception):
	pass
