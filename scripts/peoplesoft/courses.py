# @what	PeopleSoft Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	11/22/16

import re, sys

# parser library
# from scripts.textbooks.amazon import make_textbook
from scripts.parser_library.Requester import Requester
from scripts.parser_library.Extractor import *
from scripts.parser_library.Model import Model

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

	def __init__(self, school, url, do_tbks=True):
		self.base_url = url
		self.do_tbks = do_tbks
		self.course = Model(school)
		self.requester = Requester()
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

	def parse(self, terms, **kwargs):

		soup = self.requester.get(self.base_url, params=kwargs.get('url_params', {}))

		# create search payload
		params = PeopleSoftParser.hidden_params(soup)
		params.update(self.action('adv_search'))
		soup = self.requester.post(self.base_url, params=params)
		params.update(PeopleSoftParser.refine_search(soup))

		self.course_cleanup() # NOTE: this is neccessary, but bad hack

		for term in terms:
			self.course['term'] = term
			print 'Parsing courses for term', self.course['term']

			# update search payload with term as parameter
			params[self.actions['term_update']] = terms[term]
			params.update(self.action('term_update'))
			params.update(PeopleSoftParser.ajax_params);
			soup = self.requester.post(self.base_url, params=params)

			# update search params to get course list
			map(lambda k: params.__delitem__(k), PeopleSoftParser.ajax_params.keys())
			params.update(self.action('class_search'))

			dept_code = soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d'))['id']
			depts = {dept['value']: dept.text for dept in self.find_all['depts'](soup)}

			for dept in depts:
				self.course['dept'] = depts[dept]
				print '> Parsing courses in department', self.course['dept']

				# Update search payload with department code
				params[dept_code] = dept

				# Get course listing page for department
				soup = self.requester.post(self.base_url, params=params)
				if not self.valid_search_page(soup):
					continue

				self.parse_course_list(self.find_all['courses'](soup), soup)

			self.course.wrap_up()

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
		print '\t' + title
		rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title)
		self.course['section_type'] = PeopleSoftParser.SECTION_MAP.get(subtitle.split('|')[2].strip(), 'L')

		# Place course info into course model
		self.course['code'] 	= rtitle.group(1)
		self.course['section'] 	= rtitle.group(2)
		self.course['name'] 	= rtitle.group(3)
		self.course['credits']	= float(re.match(r'(\d*).*', units).group(1))
		self.course['descr'] 	= extract_info(self.course, descr.text) if descr else ''
		self.course['notes'] 	= extract_info(self.course, notes.text) if notes else ''
		self.course['info'] 	= extract_info(self.course, info.text) if info else ''
		self.course['units'] 	= re.match(r'(\d*).*', units).group(1)
		self.course['size'] 	= int(capacity)
		self.course['enrolment'] = int(enrollment)
		self.course['instrs'] 	= ', '.join({instr.text for instr in instrs})
		self.course['areas'] 	= ', '.join((extract_info(self.course, l) for l in re.sub(r'(<.*?>)', '\n', str(areas)).splitlines() if l.strip())) if areas else '' # FIXME -- small bug

		course = self.course.create_course()
		section = self.course.create_section(course)

		# create textbooks
		if self.do_tbks:
			map(lambda isbn: make_textbook(isbn[1], isbn[0], section), isbns)

		# offering details
		for sched, loc, date in zip(scheds, locs, dates):

			rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)

			if rsched:
				days = map(lambda d: PeopleSoftParser.DAY_MAP[d], re.findall(r'[A-Z][^A-Z]*', rsched.group(1)))
				time = (time_12to24(rsched.group(2)), time_12to24(rsched.group(3)))
			else: # handle TBA classes
				days = None
				time = (None, None)

			self.course['time_start'] = time[0]
			self.course['time_end'] = time[1]
			self.course['location'] = loc.text
			self.course['days'] = days

			self.course.create_offerings(section)

		self.course_cleanup()

	@staticmethod
	def parse_textbooks(soup):
		isbns = zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')))
		for i in range(len(isbns)):
			isbns[i] = (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R')
		return isbns
		# return map(lambda i: (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R'), range(len(isbns)))

	def course_cleanup(self):
		self.course['prereqs'] = ''
		self.course['coreqs'] = ''
		self.course['geneds'] = ''

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
# 	self.course['department'] = kwargs['department_regex'].match(dept.text).group(1)
# else:
# 	self.course['department'] = dept.text
