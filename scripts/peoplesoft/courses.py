# @what	PeopleSoft Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	11/22/16

import re, sys
from abc import ABCMeta, abstractmethod

# parser library
# from scripts.textbooks.amazon import make_textbook
from scripts.parser_library.Requester import Requester
from scripts.parser_library.Extractor import *
from scripts.parser_library.Model import Model
from scripts.parser_library.Ingestor import Ingestor
from scripts.parser_library.BaseParser import CourseParser
from scripts.parser_library.internal_exceptions import CourseParseError

class PeopleSoftParser(CourseParser):
	__metaclass__ = ABCMeta

	DAY_MAP = {
		'Mo' : 'M',
		'Tu' : 'T',
		'We' : 'W',
		'Th' : 'R',
		'Fr' : 'F',
		'Sa' : 'S',
		'Su' : 'U'
	}

	SECTION_MAP = {
		'Lecture': 'L',
		'Laboratory': 'P',
		'Discussion': 'T',
		'Tutorial': 'T',
	}

	ajax_params = {
		'ICAJAX': '1',
		'ICNAVTYPEDROPDOWN': '0'
	}

	def __init__(self, school, url, textbooks=True, **kwargs):
		self.base_url = url
		self.do_tbks = textbooks
		self.actions = {
			'adv_search':	'DERIVED_CLSRCH_SSR_EXPAND_COLLAPS$149$$1',
			'save':			'#ICSave',
			'term_update':	'CLASS_SRCH_WRK2_STRM$35$',
			'class_search':	'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH',
		}
		self.find_all = {
			'depts':	lambda soup: soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d')).find_all('option')[1:],
			'courses':	lambda soup: soup.find_all('table', {'class' : 'PSLEVEL1GRIDNBONBO'}),
			'isbns':	lambda soup: zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*'))),
		}
		super(PeopleSoftParser, self).__init__(school, **kwargs)

	@abstractmethod
	def start(self, **kwargs):
		'''Start parsing courses!'''

	def parse(self, years,
		department=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		self.verbosity = verbosity
		self.textbooks = textbooks

		soup = self.requester.get(self.base_url, params=kwargs.get('url_params', {}))

		# create search payload
		params = PeopleSoftParser.hidden_params(soup)
		params.update(self.action('adv_search'))
		soup = self.requester.post(self.base_url, params=params)
		params.update(PeopleSoftParser.refine_search(soup))

		self.cleanup() # NOTE: this is neccessary, but bad hack

		for year, terms in years.items():
			self.ingest['year'] = year
			for term_name, term_code in terms.items():
				self.ingest['term'] = term_name

				if self.verbosity >= 0:
					print 'Parsing courses for', term_name, year

				# update search payload with term as parameter
				params[self.actions['term_update']] = term_code
				params.update(self.action('term_update'))
				params.update(PeopleSoftParser.ajax_params);
				soup = self.requester.post(self.base_url, params=params)

				# update search params to get course list
				map(lambda k: params.__delitem__(k), PeopleSoftParser.ajax_params.keys())
				params.update(self.action('class_search'))

				dept_key = soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d'))['id']
				departments = {dept['value']: dept.text for dept in self.find_all['depts'](soup)}

				if department and department != 'all':
					department_code = department
					if department_code not in departments:
						raise CourseParseError('invalid department code %(department)s')
					departments = {department_code: departments[department_code]}

				for dept_code, dept_name in departments.items():
					self.ingest['dept_name'] = dept_name
					self.ingest['dept_code'] = dept_code

					if self.verbosity >= 1:
						print '> Parsing courses in department', dept_name

					# Update search payload with department code
					params[dept_key] = dept_code

					# Get course listing page for department
					soup = self.requester.post(self.base_url, params=params)
					if not self.valid_search_page(soup):
						continue

					self.parse_course_list(self.find_all['courses'](soup), soup)

		self.ingest.wrap_up()

	def parse_course_list(self, courses, soup):
		# fill payload for course description page request
		payload = PeopleSoftParser.hidden_params(soup)

		for i in range(len(courses)):
			self.actions['details'] = 'MTG_CLASS_NBR$' + str(i)
			payload.update(self.action('details'))
			soup = self.requester.get(self.base_url, params=payload)
			self.parse_course_description(soup)

	def parse_course_description(self, soup):
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
		isbns 	= PeopleSoftParser.parse_textbooks(soup)

		# Extract info from title
		if self.verbosity >=2:
			print '\t' + title

		rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title)
		# self.ingest['section_type'] = PeopleSoftParser.SECTION_MAP.get(subtitle.split('|')[2].strip(), 'L')
		self.ingest['section_type'] = subtitle.split('|')[2].strip()

		# Place course info into course model
		self.ingest['course_code'] 	= rtitle.group(1)
		self.ingest['course_name'] 	= rtitle.group(3)
		self.ingest['section_code'] = rtitle.group(2)
		self.ingest['credits']	= float(re.match(r'(\d*).*', units).group(1))
		self.ingest['description'] 	= [
			extract_info(self.ingest, descr.text) if descr else '',
			extract_info(self.ingest, notes.text) if notes else '',
			extract_info(self.ingest, info.text) if info else ''
		]
		self.ingest['size'] 	= int(capacity)
		self.ingest['enrolment'] = int(enrollment)
		self.ingest['instrs'] 	= ', '.join({instr.text for instr in instrs})
		self.ingest['areas'] 	= (extract_info(self.ingest, l) for l in re.sub(r'(<.*?>)', '\n', str(areas)).splitlines() if l.strip()) if areas else '' # FIXME -- small bug
		# print 'areas:', areas
		# print 'areas', list(self.ingest['areas'])
		# print 'areas - geneds', list(self.ingest['geneds'])

		course = self.ingest.ingest_course()
		section = self.ingest.ingest_section(course)

		# # NOTE: section is no longer a django object
		# # TODO - change query to handle class code
		# # create textbooks
		# if self.textbooks:
		# 	for isbn in isbns:
		# 		print isbn[1], isbn[0], section
		# 	map(lambda isbn: make_textbook(isbn[1], isbn[0], section['code']), isbns)

		# offering details
		for sched, loc, date in zip(scheds, locs, dates):

			rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)

			if rsched:
				days = map(lambda d: PeopleSoftParser.DAY_MAP[d], re.findall(r'[A-Z][^A-Z]*', rsched.group(1)))
				time = (time_12to24(rsched.group(2)), time_12to24(rsched.group(3)))
			else: # handle TBA classes
				days = None
				time = (None, None)

			self.ingest['time_start'] = time[0]
			self.ingest['time_end'] = time[1]
			re.match(r'(.*) (\d+)', loc.text)
			self.ingest['location'] = loc.text
			self.ingest['days'] = days

			self.ingest.ingest_offerings(section)

		self.cleanup()

	@staticmethod
	def parse_textbooks(soup):
		isbns = zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')))
		for i in range(len(isbns)):
			isbns[i] = (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R')
		return isbns
		# return map(lambda i: (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R'), range(len(isbns)))

	def cleanup(self):
		self.ingest['prereqs'] = ''
		self.ingest['coreqs'] = ''
		self.ingest['geneds'] = ''
		self.ingest['fees'] = '' # NOTE: caused issue with extractor

	@staticmethod
	def hidden_params(soup, params=None, ajax=False):
		if params is None: params = {}

		find = lambda tag: soup.find(tag, id=re.compile(r'win\ddivPSHIDDENFIELDS'))

		hidden = find('div')
		if not hidden:
			hidden = find('field')

		params.update({a['name']: a['value'] for a in hidden.find_all('input')})

		if ajax:
			params.update(PeopleSoftParser.ajax_params)
		return params

	def valid_search_page(self, soup):
		# check for valid search/page
		errmsg = soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'})
		if soup.find('td', {'id' : 'PTBADPAGE_' }) or errmsg:
			if errmsg:
				print 'Error on search: ' + errmsg.text
			return False
		elif soup.find('span', {'class','SSSMSGINFOTEXT'}):
			# too many search results
			soup = self.handle_special_case_on_search(soup)

		return True

	def action(self, act):
		return {'ICAction' : self.actions[act]}

	@staticmethod
	def refine_search(soup):
		''' Virtually refined search (to get around min search param requirement). '''
		query = {}
		query['SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4'] = 'N'
		for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
			query['SSR_CLSRCH_WRK_' + day + '$5'] = 'Y'
			query['SSR_CLSRCH_WRK_' + day + '$chk$5'] = 'Y'
		query['SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5'] = 'J'
		query[soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_INSTRUCTION_MODE\$\d'))['id']] = 'P'
		return query

	def handle_special_case_on_search(self, soup):
		print 'SPECIAL SEARCH MESSAGE: ' + soup.find('span', {'class','SSSMSGINFOTEXT'}).text

		query = PeopleSoftParser.hidden_params(soup, ajax=True)
		query['ICAction'] = '#ICSave'

		return self.requester.post(self.base_url, params=query)

# FOR PENNSTATE
# if kwargs.get('department_regex'):
# 	self.ingest['department'] = kwargs['department_regex'].match(dept.text).group(1)
# else:
# 	self.ingest['department'] = dept.text
