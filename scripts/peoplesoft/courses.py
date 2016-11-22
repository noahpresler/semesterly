import django, os, datetime, requests, cookielib, re, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip

from sets import Set

from scripts.textbooks.amazon import make_textbook
from scripts.parser_library.Requester import Requester

class PeopleSoftParser:

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
		'Discussion': 'T'
	}

	def __init__(self, school, url):
		self.base_url = url
		self.school = school
		self.requester = Requester()
		self.course = {}

	def parse(self, terms, **kwargs):

		soup = self.requester.get(self.base_url, params=kwargs['url_params'] if kwargs.get('url_params') else {}, parser=True)

		# create search payload with hidden form data
		search_query = {a['name']: a['value'] for a  in soup.find('div', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}

		# advanced search
		search_query['ICAction'] = 'DERIVED_CLSRCH_SSR_EXPAND_COLLAPS$149$$1'
		soup = self.requester.post(self.base_url, params=search_query, parser=True)

		# virtually refined search (to get around min search param requirement)
		search_query['SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4'] = 'N'
		for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
			search_query['SSR_CLSRCH_WRK_' + day + '$5'] = 'Y'
			search_query['SSR_CLSRCH_WRK_' + day + '$chk$5'] = 'Y'
		search_query['SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5'] = 'J'
		search_query[soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_INSTRUCTION_MODE\$\d'))['id']] = 'P'

		# TODO - necessary clutter (not really sure why this is here anymore - should be called course_setup but does the same)
		self.course_cleanup()

		TYPES = Set()

		for term in terms:

			print 'Parsing courses for', term

			self.course['semester'] = term

			# update search payload with term as parameter
			search_query['CLASS_SRCH_WRK2_STRM$35$'] = terms[term]
			search_query['ICAJAX'] = '1'
			search_query['ICNAVTYPEDROPDOWN'] = '0'
			search_query['ICAction'] = 'CLASS_SRCH_WRK2_STRM$35$'
			soup = self.requester.post(self.base_url, params=search_query, parser='lxml')

			# TODO - this might not be necessary
			del search_query['ICAJAX']
			del search_query['ICNAVTYPEDROPDOWN']

			# update search action to get course list
			search_query['ICAction'] = 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH'

			# extract department query list
			options = soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d'))
			search_id = options['id']
			departments = options.find_all('option')[1:] # NOTE: first element of dropdown lists in search area is empty

			for department in departments:

				print '> Parsing courses in department', department.text

				if kwargs.get('department_regex'):
					self.course['department'] = kwargs['department_regex'].match(department.text).group(1)
				else:
					self.course['department'] = department.text

				# Update search payload with department code
				search_query[search_id] = department['value']

				# Get course listing page for department
				soup = self.requester.post(self.base_url, params=search_query, parser=True)

				special = False # FIXME -- nasty hack, fix it!

				# check for valid search/page
				if soup.find('td', {'id' : 'PTBADPAGE_' }) or soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
					if soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
						print 'Error on search: ' + soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}).text
					continue
				elif soup.find('span', {'class','SSSMSGINFOTEXT'}):
					soup = self.handle_special_case_on_search(soup)
					special = True

				# fill payload for course description page request
				descr_payload = {a['name']: a['value'] for a in soup.find('div' if not special else 'field', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}

				courses = soup.find_all('table', {'class' : 'PSLEVEL1GRIDNBONBO'})

				# for all the courses on the page
				for i in range(len(courses)):
					descr_payload['ICAction'] = 'MTG_CLASS_NBR$' + str(i)

					# Get course description page
					soup = self.requester.get(self.base_url, params=descr_payload, parser=True)

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
					print '\t' + title
					rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title)
					self.course['section_type'] = PeopleSoftParser.SECTION_TYPE_MAP.get(subtitle.split('|')[2].strip(), 'L')

					# Place course info into course model
					self.course['code'] 	= rtitle.group(1)
					self.course['section'] 	= rtitle.group(2)
					self.course['name'] 	= rtitle.group(3)
					self.course['credits']	= float(re.match(r'(\d*).*', units).group(1))
					self.course['descr'] 	= self.extract_info(descr.text) if descr else ''
					self.course['notes'] 	= self.extract_info(notes.text) if notes else ''
					self.course['info'] 	= self.extract_info(info.text) if info else ''
					self.course['units'] 	= re.match(r'(\d*).*', units).group(1)
					self.course['size'] 	= int(capacity)
					self.course['enrolment'] = int(enrollment)
					self.course['instrs'] 	= ', '.join({instr.text for instr in instrs})
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
							days = map(lambda d: PeopleSoftParser.DAY_MAP[d], re.findall(r'[A-Z][^A-Z]*', rsched.group(1)))
							time = (PeopleSoftParser.time_12to24(rsched.group(2)), PeopleSoftParser.time_12to24(rsched.group(3)))
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

			print TYPES

	def handle_special_case_on_search(self, soup):
		print 'SPECIAL SEARCH MESSAGE: ' + soup.find('span', {'class','SSSMSGINFOTEXT'}).text

		search_query2 = {a['name']: a['value'] for a  in soup.find('div', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}
		search_query2['ICAction'] = '#ICSave'
		search_query2['ICAJAX'] = '1'
		search_query2['ICNAVTYPEDROPDOWN'] = '0'

		return self.requester.post(self.base_url, params=search_query2, parser='lxml')

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

	# NOTE: chapman specific
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
