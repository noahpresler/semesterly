# @what	Chapman Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	9/3/16

import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

class ChapmanParser:

	SCHOOL = 'chapman'
	BASE_URL = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
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
					headers = ChapmanParser.HEADERS,
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
				headers = ChapmanParser.HEADERS,
				verify = True,
			)

			# print POST, r.url

			return post

		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None

	def parse(self):

		soup = BeautifulSoup(self.get_html(ChapmanParser.BASE_URL))

		# create search payload with hidden form data
		search_query = {a['name']: a['value'] for a  in soup.find('div', {'id' : 'win1divPSHIDDENFIELDS'}).find_all('input')}
		search_query['ICAction'] = 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH'
		search_query['SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4'] = 'N'
		for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
			search_query['SSR_CLSRCH_WRK_' + day + '$5'] = 'Y'
			search_query['SSR_CLSRCH_WRK_' + day + '$chk$5'] = 'Y'
		search_query['SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5'] = 'J'

		# extract search query info
		terms = soup.find('select', {'id' : 'CLASS_SRCH_WRK2_STRM$35$'}).find_all('option')
		departments = soup.find('select', {'id' : 'SSR_CLSRCH_WRK_SUBJECT_SRCH$1'}).find_all('option')
		# NOTE: first element of dropdown lists in search area is empty

		for term in terms[1:]:

			print 'Parsing courses for', term.text

			self.course['semester'] = term.text[0].upper()

			# update search payload with term as parameter
			search_query['CLASS_SRCH_WRK2_STRM$35$'] = term['value']

			for department in departments[1:]:

				print '> Parsing courses in department', department.text

				self.course['department'] = department['value']

				# Update search payload with department code
				search_query['SSR_CLSRCH_WRK_SUBJECT_SRCH$1'] = department['value']

				# Get course listing page for department
				soup = BeautifulSoup(self.get_html(ChapmanParser.BASE_URL, search_query))

				# check for valid search/page
				if soup.find('td', {'id' : 'PTBADPAGE_' }) or soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
					print 'ERROR on search'
					if soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
						print soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}).text
					continue

				# fill payload for course description page request
				descr_payload = {a['name']: a['value'] for a in soup.find('div', {'id' : 'win1divPSHIDDENFIELDS'}).find_all('input')}

				courses = soup.find_all('table', {'class' : 'PSLEVEL1GRIDNBONBO'})

				# for all the courses on the page
				for i in range(len(courses)):
					descr_payload['ICAction'] = 'MTG_CLASS_NBR$' + str(i)

					# Get course description page
					soup = BeautifulSoup(self.get_html(ChapmanParser.BASE_URL, descr_payload))

					# scrape info from page
					title 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCR200'}).text
					units 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_UNITS_RANGE'}).text
					capacity 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_CAP'}).text
					enrollment 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_TOT'}).text
					waitlist 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_WAIT_TOT'}).text
					description = soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCRLONG'})
					notes 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG'})
					info 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'})

					# parse table of times
					scheds 	= soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
					locs 	= soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
					instrs 	= soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
					dates 	= soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))
					isbns 	= soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*'))

					# Extract info from title
					rtitle = re.match(r'(.*) - (\d*)(.*)', title)

					# Place course info into course model
					self.course['code'] = rtitle.group(1)
					self.course['name'] = rtitle.group(3).strip()
					self.course['credits'] = float(re.match(r'(\d*).*', units).group(1))
					self.course['descr'] = '\n-'.join(map(lambda a: a.text if a else '', [description, info, notes]))
					self.course['units'] = re.match(r'(\d*).*', units).group(1)
					self.course['section'] = rtitle.group(2)
					self.course['size'] = int(capacity)
					self.course['enrolment'] = int(enrollment)
					course = self.create_course()

					for sched, loc, instr, date in izip(scheds, locs, instrs, dates):

						rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)
						days = map(lambda d: ChapmanParser.DAY_MAP[d], re.findall('[A-Z][^A-Z]*', rsched.group(1)))
						time = (ChapmanParser.time_12to24(rsched.group(2)), ChapmanParser.time_12to24(rsched.group(3)))

						self.course['instrs'] = instr.text # NOTE: instr applied to each offering
						self.course['time_start'] = time[0]
						self.course['time_end'] = time[1]
						self.course['location'] = loc.text
						self.course['days'] = days

						self.create_offerings(self.create_section(course))

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
	def wrap_up(self):
			update_object, created = Updates.objects.update_or_create(
					school=ChapmanParser.SCHOOL,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
			)
			update_object.save()

	def create_course(self):
		print self.course.get('credits')
		course, CourseCreated = Course.objects.update_or_create(
			code = self.course['code'],
			school = ChapmanParser.SCHOOL,
			defaults={
				'name': self.course.get('name'),
				'description': self.course.get('descr'),
				'department': self.course.get('department'),
				'num_credits': self.course.get('credits'),
				# 'areas': self.course.get('areas'),
				# 'prerequisites': self.course.get('prereqs'),
				# 'level': self.course.get('level') # NOTE: this should not be required as input
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
		for day in list(self.course.get('days')):
			offering_model, offering_was_created = Offering.objects.update_or_create(
				section = section_model,
				day = day,
				time_start = self.course.get('time_start'),
				time_end = self.course.get('time_end'),
				defaults = {
					'location': self.course.get('location')
				}
			)

def main():
	vp = ChapmanParser()
	vp.parse()

if __name__ == "__main__":
	main()