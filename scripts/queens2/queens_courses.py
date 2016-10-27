# @what	Queens (2) Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/21/16

import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

from amazonproduct import API
api = API(locale='us')

class QueensParser:

	SCHOOL = 'queens2'
	BASE_URL = 'https://saself.ps.queensu.ca/psp/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL'
	HEADERS = {'User-Agent' : 'My User Agent 1.0'}
	DAY_MAP = {
		'Mo' : 'M',
		'Tu' : 'T',
		'We' : 'W',
		'Th' : 'R',
		'Fr' : 'F',
		'Sa' : 'S',
		'Su' : 'U'
	}
	USER = '1dc4'
	PASS = 'CREOmule1'

	def __init__(self):
		self.course = {}
		self.session = requests.Session()
		self.cookies = cookielib.CookieJar()

	def get_html(self, url, payload=''):
		html = None
		while html is None:
			try:
				r = self.session.get(
					url,
					params = payload,
					cookies = self.cookies,
					headers = QueensParser.HEADERS,
					verify = True
				)

				if r.status_code == 200:
					html = r.text

				# print GET, r.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return html.encode('utf-8')

	def post_http(self, url, form, payload=''):

		try:
			post = self.session.post(
				url,
				data = form,
				params = payload,
				cookies = self.cookies,
				headers = QueensParser.HEADERS,
				verify = True,
			)

			# print POST, r.url

			return post

		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None

	def login(self):
		login_url = 'https://login.queensu.ca/idp/Authn/UserPassword'

		# collect some cookies (yummy!)
		self.get_html(QueensParser.BASE_URL)
		html = self.get_html('https://my.queensu.ca/')

		credentials = {
			'j_username':'1dc4',
			'j_password':'CREOmule1',
			'Login':' Log In '
		}

		post = self.post_http(login_url, credentials)
		print post
		print post.text

		exit(0)

	def parse(self):

		self.login()

		soup = BeautifulSoup(self.get_html(QueensParser.BASE_URL))

		# create search payload with hidden form data
		search_query = {a['name']: a['value'] for a  in soup.find('div', {'id' : 'win0divPSHIDDENFIELDS'}).find_all('input')}
		search_query['ICAction'] = 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH'
		search_query['SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4'] = 'N'
		for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
			search_query['SSR_CLSRCH_WRK_' + day + '$5'] = 'Y'
			search_query['SSR_CLSRCH_WRK_' + day + '$chk$5'] = 'Y'
		search_query['SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5'] = 'J'

		# extract search query info
		# terms = soup.find('select', {'id' : 'CLASS_SRCH_WRK2_STRM$35$'}).find_all('option')
		departments = soup.find('select', {'id' : 'SSR_CLSRCH_WRK_SUBJECT_SRCH$2'}).find_all('option')[1:]
		# NOTE: first element of dropdown lists in search area is empty

		# NOTE: hardcoded semesters Fall, Interim, Spring 2016-2017
		# terms = {'F':'2168', 'I':'2172', 'S':'2174'}
		terms = {'F':'2168', 'S':'2171'}

		for term in terms:

			print 'Parsing courses for', term

			self.course['semester'] = term

			# update search payload with term as parameter
			search_query['CLASS_SRCH_WRK2_STRM$35$'] = terms[term]

			for department in departments:

				print '> Parsing courses in department', department.text

				self.course['department'] = department.text

				# Update search payload with department code
				search_query['SSR_CLSRCH_WRK_SUBJECT_SRCH$2'] = department['value']

				# Get course listing page for department
				soup = BeautifulSoup(self.post_http(QueensParser.BASE_URL, search_query).text, 'html.parser')

				# check for valid search/page
				if soup.find('td', {'id' : 'PTBADPAGE_' }) or soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
					if soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
						print 'Error on search: ' + soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}).text
					continue

				# fill payload for course description page request
				descr_payload = {a['name']: a['value'] for a in soup.find('div', {'id' : 'win0divPSHIDDENFIELDS'}).find_all('input')}

				courses = soup.find_all('table', {'class' : 'PSLEVEL1GRIDNBONBO'})

				# for all the courses on the page
				for i in range(len(courses)):
					descr_payload['ICAction'] = 'MTG_CLASS_NBR$' + str(i)

					# Get course description page
					soup = BeautifulSoup(self.get_html(QueensParser.BASE_URL, descr_payload))

					# scrape info from page
					title 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCR200'}).text
					units 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_UNITS_RANGE'}).text
					capacity 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_CAP'}).text
					enrollment 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_TOT'}).text
					waitlist 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_WAIT_TOT'}).text
					descr 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCRLONG'})
					notes 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG'})
					info 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'})

					# parse table of times
					scheds 	= soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
					locs 	= soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
					instrs 	= soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
					dates 	= soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))

					# parse textbooks
					isbns 	= self.parse_textbooks(soup)

					# Extract info from title
					print '\t' + title
					rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title.encode('ascii', 'ignore'))

					# Place course info into course model
					self.course['code'] 	= rtitle.group(1)
					self.course['section'] 	= rtitle.group(2)
					self.course['name'] 	= rtitle.group(3)
					self.course['credits']	= float(re.match(r'(\d*).*', units).group(1))
					self.course['descr'] 	= self.extract_prereqs(descr.text) if descr else ''
					self.course['notes'] 	= self.extract_prereqs(notes.text) if notes else ''
					self.course['info'] 	= self.extract_prereqs(info.text) if info else ''
					self.course['units'] 	= re.match(r'(\d*).*', units).group(1)
					self.course['size'] 	= int(capacity)
					self.course['enrolment'] = int(enrollment)
					self.course['instrs'] = ', '.join({instr.text for instr in instrs})

					course = self.create_course()
					section = self.create_section(course)

					# create textbooks
					# map(lambda isbn: self.make_textbook(isbn[1], isbn[0], section), isbns)

					# offering details
					for sched, loc, date in izip(scheds, locs, dates):

						rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)

						if rsched:
							days = map(lambda d: QueensParser.DAY_MAP[d], re.findall('[A-Z][^A-Z]*', rsched.group(1)))
							time = (QueensParser.time_12to24(rsched.group(2)), QueensParser.time_12to24(rsched.group(3)))
						else: # handle TBA classes
							days = None
							time = (None, None)

						self.course['time_start'] = time[0]
						self.course['time_end'] = time[1]
						self.course['location'] = loc.text
						self.course['days'] = days

						self.create_offerings(section)

			QueensParser.wrap_up()
			print '>>>>>> WRAP UP <<<<<<'

	def parse_textbooks(self, soup):
		isbns = zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')))
		for i in range(len(isbns)):
			isbns[i] = (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R')
		return isbns
		# return map(lambda i: (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R'), range(len(isbns)))

	# NOTE: chapman specific
	def extract_prereqs(self, text):

		extractions = {
			'prereqs' : r'Prerequisite(?:s?)[:,]\s(.*?)\.',
			'coreqs'  : r'Corequisite(?:s?)[:,]\s(.*?)\.'
		}

		for ex in extractions:
			rex = re.compile(extractions[ex])
			extracted = rex.search(text)
			if extracted:
				self.course[ex] = extracted.group(1)
			else:
				self.course[ex] = ''
			text = rex.sub('', text).strip()

		return text

	@staticmethod
	def time_12to24(time12):

		# Regex extract
		match = re.match("(\d*):(\d*)(.)", time12)

		# Transform to 24 hours
		hours = int(match.group(1))
		if re.search(r'[pP]', match.group(3)):
			hours = (hours%12)+12

		# Return as 24hr-time string
		return str(hours) + ":" + match.group(2)

	@staticmethod
	def wrap_up():
			update_object, created = Updates.objects.update_or_create(
					school=QueensParser.SCHOOL,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
			)
			update_object.save()

	def create_course(self):
		course, CourseCreated = Course.objects.update_or_create(
			code = self.course['code'],
			school = QueensParser.SCHOOL,
			defaults={
				'name': self.course.get('name'),
				'description': self.course.get('descr'),
				'department': self.course.get('department'),
				'num_credits': self.course.get('credits'),
				'prerequisites': self.course.get('prereqs'),
				'corequisites': self.course.get('coreqs'),
				'notes': self.course.get('notes'),
				'info' : self.course.get('info')
				# 'areas': self.course.get('areas'),
			}
		)
		return course

	def create_section(self, course_model):
		# TODO - deal with cancelled course?
		section, section_was_created = Section.objects.update_or_create(
			course = course_model,
			semester = self.course['semester'],
			meeting_section = self.course['section'],
			defaults = {
				'instructors': self.course.get('instrs'),
				'size': self.course.get('size'),
				'enrolment': self.course.get('enrolment')
			}
		)
		return section

	def create_offerings(self, section_model):
		if self.course.get('days'):
			for day in self.course.get('days'):
				offering_model, offering_was_created = Offering.objects.update_or_create(
					section = section_model,
					day = day,
					time_start = self.course.get('time_start'),
					time_end = self.course.get('time_end'),
					defaults = {
						'location': self.course.get('location')
					}
				)

	# NOTE: (mostly) copied from base bn parser, need to do full integration
	def make_textbook(self, is_required, isbn_number, section):

		info = self.get_amazon_fields(isbn_number)

		# update/create textbook
		textbook_data = {
			'detail_url': info['DetailPageURL'],
			'image_url': info["ImageURL"],
			'author': info["Author"],
			'title': info["Title"]
		}
		textbook, created = Textbook.objects.update_or_create(isbn=isbn_number,
														defaults=textbook_data)

		# link to course section
		section, created = TextbookLink.objects.update_or_create(
			is_required = is_required,
			section = section,
			textbook = textbook
		)

		# print results
		if created:
			print "Textbook created: " + textbook.title
		else:
			print "Textbook found, not created: " + textbook.title

	# NOTE: (mostly) copied from base bn parser, need to do full integration
	def get_amazon_fields(self,isbn):
		try:
			result = api.item_lookup(isbn, IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
			info = {
				"DetailPageURL" : self.get_detail_page(result),
				"ImageURL" : self.get_image_url(result),
				"Author" : self.get_author(result),
				"Title" : self.get_title(result)
			}
		except:
			import traceback
			traceback.print_exc()
			info = {
				"DetailPageURL" : "Cannot be found",
				"ImageURL" : "Cannot be found",
				"Author" : "Cannot be found",
				"Title" : "Cannot be found"
			}
		return info

def main():
	p = QueensParser()
	p.parse()

if __name__ == "__main__":
	main()