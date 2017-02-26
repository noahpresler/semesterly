# @what     UMich modified peoplesoft Course Parser
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/15/16

import django, os, datetime, requests, cookielib, re, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip
from bs4 import BeautifulSoup

from sets import Set

# from scripts.textbooks.amazon import make_textbook

class PeoplesoftParser:

	DAY_MAP = {
		'Mo' : 'M',
		'Tu' : 'T',
		'We' : 'W',
		'Th' : 'R',
		'Fr' : 'F',
		'Sa' : 'S',
		'Su' : 'U'
	}

	SECTION_TYPE_MAP = {
		'Lecture': 'L',
		'Laboratory': 'P',
		'Discussion': 'T',
	}

	def __init__(self, school, url):
		self.session = requests.Session()
		# self.headers = {'User-Agent' : UserAgent().random} # why does this not work anymore?
		self.headers = {'User-Agent' : 'UserAgent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.base_url = url
		self.school = school
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
					verify = True
				)

				if r.status_code == 200:
					html = r.text

				# print 'GET', r.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]) + '\n')
				raw_input("Press Enter to continue...")
				html = None

		return html.encode('utf-8')

	def post_http(self, url, form, payload=''):

		post = None
		while post is None:
			try:
				post = self.session.post(
					url,
					data = form,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = True,
				)

				# print 'POST', r.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]) + '\n')
				raw_input("Press Enter to continue...")
				post = None

		return post

	def parse(self, terms, **kwargs):

		# soup = BeautifulSoup(self.get_html(self.base_url, kwargs..get('url_params', {})))

		# create search payload with hidden form data
		# search_query = {a['name']: a['value'] for a  in soup.find('div', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}

		# TODO - necessary clutter (not really sure why this is here anymore - should be called course_setup but does the same)
		self.course_cleanup()

		for term in terms:

			print 'Parsing courses for', term

			self.course['semester'] = term

			term_base_url = 'https://csprod.dsc.umich.edu/services/schedofclasses'

			# update search payload with term as parameter
			soup = BeautifulSoup(self.get_html(term_base_url, {'strm':terms[term]}), 'html.parser')

			# construct search query
			search_query = {a['name']: a['value'] for a in soup.find('div', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}
			search_query['ICAJAX'] = '1'
			search_query['ICNAVTYPEDROPDOWN'] = '0'

			groups = soup.find_all('a', id=re.compile(r'M_SR_DERIVED2_GROUP1\$\d'))

			for group in groups:
				print '> Parsing courses in group', group.text

				search_query['ICAction'] = group['id']

				soup = BeautifulSoup(self.post_http(self.base_url, search_query).text, 'lxml')
				# print soup.prettify().encode('utf-8')

				# update search action to get course list
				search_query2 = {a['name']: a['value'] for a in soup.find('field', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}
				search_query2['ICAJAX'] = '1'
				search_query2['ICNAVTYPEDROPDOWN'] = '0'

				# extract department query list
				departments = soup.find_all('a', id=re.compile(r'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH\$\d'))
				department_names = soup.find_all('span', id=re.compile(r'M_SR_SS_SUBJECT_DESCR\$\d'))
				depts = {dept['id']: dept_name.text for dept, dept_name in zip(departments, department_names)}
				print depts

				for dept in depts:

					print '\t>> Parsing courses in department', depts[dept]

					if kwargs.get('department_regex'):
						self.course['department'] = kwargs['department_regex'].match(dept).group(1)
					else:
						self.course['department'] = depts[dept]

					search_query2['ICAction'] = dept

					# Get course listing page for department
					soup = BeautifulSoup(self.post_http(self.base_url, search_query2).text, 'lxml')

					isxml = True # Umich dumps xml!

					# check for valid search/page
					if soup.find('td', {'id' : 'PTBADPAGE_' }) or soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
						if soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
							print 'Error on search: ' + soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}).text
						continue
					elif soup.find('span', {'class','SSSMSGINFOTEXT'}):
						soup = self.handle_special_case_on_search(soup)
						isxml = True

					# fill payload for course description page request
					descr_payload = {a['name']: a['value'] for a in soup.find('div' if not isxml else 'field', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}

					courses = soup.find_all('table', {'class' : 'PSLEVEL1GRIDROWNBO'})

					# for all the courses on the page
					for i in range(len(courses)):
						descr_payload['ICAction'] = 'MTG_CLASS_NBR$' + str(i)

						# Get course description page
						soup = BeautifulSoup(self.get_html(self.base_url, descr_payload))

						# scrape info from page
						title 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCR200'}).text.encode('ascii', 'ignore')
						subtitle	= soup.find('span', {'id' : 'DERIVED_CLSRCH_SSS_PAGE_KEYDESCR'}).text.encode('ascii', 'ignore')
						units 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_UNITS_RANGE'}).text
						capacity 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_CAP'}).text
						enrollment 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_TOT'}).text
						waitlist 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_WAIT_TOT'}).text
						descr 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCRLONG'})
						notes 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG'})
						info 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'})
						areas		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_CRSE_ATTR_LONG'})

						# parse table of times
						scheds 	= soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
						locs 	= soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
						instrs 	= soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
						dates 	= soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))

						# parse textbooks
						isbns 	= self.parse_textbooks(soup)

						# Extract info from title
						print '\t\t' + title
						rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title)
						
						# Extract info from subtitle
						self.course['section_type'] = PeoplesoftParser.SECTION_TYPE_MAP.get(subtitle.split('|')[2].strip(), 'L')

						# Place course info into course model
						self.course['code'] 	= '-'.join(rtitle.group(1).split())
						self.course['section'] 	= rtitle.group(2)
						self.course['name'] 	= rtitle.group(3)
						self.course['credits']	= float(re.match(r'(\d*).*', units).group(1))
						self.course['descr'] 	= self.extract_info(descr.text) if descr else ''
						self.course['notes'] 	= self.extract_info(notes.text) if notes else ''
						self.course['info'] 	= self.extract_info(info.text) if info else ''
						self.course['units'] 	= re.match(r'(\d*).*', units).group(1)
						self.course['size'] 	= int(capacity)
						self.course['enrolment'] = int(enrollment)
						self.course['instrs'] 	= ', '.join({instr.text for instr in instrs})[:500]
						self.course['areas'] 	= ', '.join((self.extract_info(l) for l in re.sub(r'(<.*?>)', '\n', str(areas)).splitlines() if l.strip())) if areas else '' # FIXME -- small bug
						# self.course['section_type'] = section_type

						course = self.create_course()
						section = self.create_section(course)

						# create textbooks
						map(lambda isbn: make_textbook(isbn[1], isbn[0], section), isbns)

						# offering details
						for sched, loc, date in izip(scheds, locs, dates):

							rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)

							if rsched:
								days = map(lambda d: PeoplesoftParser.DAY_MAP[d], re.findall(r'[A-Z][^A-Z]*', rsched.group(1)))
								time = (PeoplesoftParser.time_12to24(rsched.group(2)), PeoplesoftParser.time_12to24(rsched.group(3)))
							else: # handle TBA classes
								days = None
								time = (None, None)

							self.course['time_start'] = time[0]
							self.course['time_end'] = time[1]
							self.course['location'] = loc.text
							self.course['days'] = days

							self.create_offerings(section)

						self.course_cleanup()

			self.wrap_up()

	def handle_special_case_on_search(self, soup):
		print 'SPECIAL SEARCH MESSAGE: ' + soup.find('span', {'class','SSSMSGINFOTEXT'}).text

		search_query2 = {a['name']: a['value'] for a  in soup.find('div', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}
		search_query2['ICAction'] = '#ICSave'
		search_query2['ICAJAX'] = '1'
		search_query2['ICNAVTYPEDROPDOWN'] = '0'

		return BeautifulSoup(self.post_http(self.base_url, search_query2).text, 'lxml')

	def parse_textbooks(self, soup):
		isbns = zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')))
		for i in range(len(isbns)):
			isbns[i] = (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R')
		return isbns
		# return map(lambda i: (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R'), range(len(isbns)))

	def course_cleanup(self):
		self.course['prereqs'] = ''
		self.course['coreqs'] = ''
		self.course['geneds'] = ''

	# NOTE: chapman specific (... not really, it works for umich too!)
	def extract_info(self, text):

		text = text.encode('utf-8', 'ignore')

		extractions = {
			'prereqs' : r'[Pp]r(?:-?)e[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
			'coreqs'  : r'[Cc]o(?:-?)[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
			'geneds' : r'(GE .*)'
		}

		for ex in extractions:
			rex = re.compile(extractions[ex])
			extracted = rex.search(text)
			if extracted:
				if len(self.course[ex]) > 0:
					self.course[ex] += ', '
				self.course[ex] += extracted.group(1) # okay b/c of course_cleanup
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

	def wrap_up(self):
			update_object, created = Updates.objects.update_or_create(
					school=self.school,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
			)
			update_object.save()

	def create_course(self):
		course, CourseCreated = Course.objects.update_or_create(
			code = self.course['code'],
			school = self.school,
			defaults={
				'name': self.course.get('name'),
				'description': self.course.get('descr'),
				'department': self.course.get('department'),
				'num_credits': self.course.get('credits'),
				'prerequisites': self.course.get('prereqs'),
				'corequisites': self.course.get('coreqs'),
				'notes': self.course.get('notes'),
				'info' : self.course.get('info'),
				'areas': self.course.get('areas') + self.course.get('geneds'),
				'geneds': self.course.get('geneds')
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
				'enrolment': self.course.get('enrolment'),
				'section_type': self.course['section_type']
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
