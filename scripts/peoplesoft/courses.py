# @what	Peoplesoft Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	11/22/16

import re, sys, itertools
from abc import ABCMeta, abstractmethod

# parser library
# from scripts.textbooks.amazon import make_textbook
from scripts.parser_library.Requester import Requester
from scripts.parser_library.Extractor import *
from scripts.parser_library.Model import Model
from scripts.parser_library.Ingestor import Ingestor
from scripts.parser_library.BaseParser import CourseParser
from scripts.parser_library.internal_exceptions import CourseParseError

class PeoplesoftParser(CourseParser):
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

	ajax_params = {
		'ICAJAX': '1',
		'ICNAVTYPEDROPDOWN': '0'
	}

	def __init__(self, school, url, url_params=None, department_name_regex=re.compile(r'(.*)'), **kwargs):
		self.base_url = url
		self.url_params = url_params
		if url_params is None:
			self.url_params = {}
		self.department_name_regex = department_name_regex

		self.ic_actions = {
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

		super(PeoplesoftParser, self).__init__(school, **kwargs)

	@abstractmethod
	def start(self, **kwargs):
		'''Start parsing courses!'''

	def parse(self, years,
		department=None,
		course=None, # NOTE: not implemented yet
		textbooks=True,
		verbosity=3,
		department_name_regex=None,
		**kwargs):

		self.verbosity = verbosity
		self.textbooks = textbooks

		# NOTE: umich child will do nothing and return an empty dict
		soup, params = self.goto_search_page(self.url_params)
		years_and_terms = self.get_years_and_terms(soup)
		for year, terms in years_and_terms.items():
			self.ingestor['year'] = year

			for term_name, term_code in terms.items():
				self.ingestor['term'] = term_name
				if self.verbosity >= 1:
					print 'Parsing courses for', term_name, year
				soup = self.term_update(term_code, params)

				groups = self.get_groups(soup, params)
				for group_id, group_name in groups.items():
					params2 = {} # second search payload
					if group_id is not None: # NOTE: true for umich parse
						if self.verbosity >= 1:
							print '> Parsing courses in group', group_name
						soup = self.group_update(group_id, params)
						params2 = PeoplesoftParser.hidden_params(soup, ajax=True)
					else:
						assert(len(groups) == 1) # sanity check
						# update search params to get course list
						params = PeoplesoftParser.exclude_ajax_params(params)
						params.update(self.action('class_search'))
						params2 = params

					# extract department list info
					dept_param_key = self.get_dept_param_key(soup)
					departments, department_ids = self.get_departments(soup, cmd_departments=department)
					for dept_code, dept_name in departments.iteritems():
						self.ingestor['dept_name'] = dept_name
						self.ingestor['dept_code'] = dept_code
						if self.verbosity >= 1:
							print '>> Parsing courses in department {} ({})'.format(dept_name, dept_code)

						# Update search payload with department code
						params2[dept_param_key] = dept_code if department_ids is None else department_ids[dept_code]

						# Get course listing page for department
						soup = self.requester.post(self.base_url, params=params2)
						if not self.valid_search_page(soup):
							continue

						courses = self.get_courses(soup)
						course_soups = self.get_course_list_as_soup(courses, soup)
						for course_soup in course_soups:
							self.parse_course_description(course_soup)

		self.ingestor.wrap_up()

	def get_years_and_terms(self, soup):
		term_datas = soup.find('select', id='CLASS_SRCH_WRK2_STRM$35$').find_all('option')
		years_terms_values = {}
		for term_data in term_datas[1:]:
			# differentiate between term name and years
			year_or_term1, year_or_term2 = term_data.text.split()
			try:
				year = str(int(year_or_term1))
				term = year_or_term2
			except ValueError:
				year = str(int(year_or_term2))
				term = year_or_term1

			if year not in years_terms_values:
				years_terms_values[year] = {}
			years_terms_values[year][term] = term_data['value']
		return years_terms_values

	def parse_term_and_years(term_and_years):
			years = { term_and_year.split()[1]: {term_and_year.split()[0]: code} for term_and_year, code in term_and_years.items() }
			for year in years:
				years[year].update({term_and_year.split()[0].title(): code for term_and_year, code in term_and_years.items() if term_and_year.split()[1] == year})
			return years

	def get_courses(self, soup):
		return self.find_all['courses'](soup)

	def goto_search_page(self, url_params):
		soup = self.requester.get(self.base_url, params=self.url_params)
		# create search payload (adv search)
		params = PeoplesoftParser.hidden_params(soup)
		params.update(self.action('adv_search'))
		soup = self.requester.post(self.base_url, params=params)
		params.update(PeoplesoftParser.refine_search(soup))
		return soup, params

	def get_groups(self, soup, params):
		return {None: None} # No groups

	def group_update(self, group_id, params):
		return # Do nothing.

	def term_update(self, term_code, params):
		'''Update search page with term as parameter.'''
		params[self.ic_actions['term_update']] = term_code
		params.update(self.action('term_update'))
		params.update(PeoplesoftParser.ajax_params)
		return self.requester.post(self.base_url, params=params)

	@staticmethod
	def exclude_ajax_params(params):
		return { k: v for k, v in params.items() if k not in PeoplesoftParser.ajax_params.keys() }

	def get_dept_param_key(self, soup):
		return soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d'))['id']

	def get_departments(self, soup, cmd_departments=None):
		extract_dept_name = lambda d: self.department_name_regex.match(d).group(1)
		departments = { dept['value']: extract_dept_name(dept.text) for dept in self.find_all['depts'](soup) }
		departments = UPeoplesoftParser.filter_departments(departments, cmd_departments)
		return departments, None

	def get_course_list_as_soup(self, courses, soup):
		# fill payload for course description page request
		payload = PeoplesoftParser.hidden_params(soup)
		for i in range(len(courses)):
			payload.update({'ICAction': 'MTG_CLASS_NBR$' + str(i)})
			soup = self.requester.get(self.base_url, params=payload)
			yield soup

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
		req 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'})
		areas		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_CRSE_ATTR_LONG'})

		# parse table of times
		scheds  = soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
		locs    = soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
		instrs  = soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
		dates   = soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))

		# parse textbooks
		isbns 	= PeoplesoftParser.parse_textbooks(soup)

		# Extract info from title
		if self.verbosity >= 2:
			print '\t' + title

		rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title)
		# self.ingestor['section_type'] = PeoplesoftParser.SECTION_MAP.get(subtitle.split('|')[2].strip(), 'L')
		self.ingestor['section_type'] = subtitle.split('|')[2].strip()

		# Place course info into course model
		self.ingestor['course_code']  = rtitle.group(1)
		self.ingestor['course_name']  = rtitle.group(3)
		self.ingestor['section_code'] = rtitle.group(2)
		self.ingestor['credits']      = float(re.match(r'(\d*).*', units).group(1))
		self.ingestor['prereqs']      = [req.text] if req else None
		self.ingestor['description']  = [
			self.extractor.extract_info(self.ingestor, descr.text) if descr else '',
			self.extractor.extract_info(self.ingestor, notes.text) if notes else ''
		]
		self.ingestor['size'] 	   = int(capacity)
		self.ingestor['enrollment'] = int(enrollment)
		instructors = []
		for instr in instrs:
			instructors += instr.text.split(', \r')
		self.ingestor['instrs']    = list(set(instructors)) # uniqueify list of instructors

		self.ingestor['areas'] = [self.extractor.extract_info(self.ingestor, areas.text)] if areas else None
			# print self.ingestor['areas']
		# self.ingestor['areas'] = list(self.extractor.extract_info(self.ingestor, l) for l in re.sub(r'(<.*?>)', '\n', str(areas)).splitlines() if l.strip()) if areas else '' # FIXME -- small bug
		# if 'geneds' in self.ingestor:
		# 	self.ingestor['areas'] = list(itertools.chain(self.ingestor['areas'], self.ingestor['geneds']))
			# self.ingestor['areas'] += self.ingestor['geneds']

		course = self.ingestor.ingest_course()
		section = self.ingestor.ingest_section(course)

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
				days = map(lambda d: PeoplesoftParser.DAY_MAP[d], re.findall(r'[A-Z][^A-Z]*', rsched.group(1)))
				time = (self.extractor.time_12to24(rsched.group(2)), self.extractor.time_12to24(rsched.group(3)))
			else: # handle TBA classes
				continue

			self.ingestor['time_start'] = time[0]
			self.ingestor['time_end'] = time[1]
			re.match(r'(.*) (\d+)', loc.text)
			self.ingestor['location'] = loc.text
			self.ingestor['days'] = days

			self.ingestor.ingest_offerings(section)

		self.cleanup()

	@staticmethod
	def parse_textbooks(soup):
		isbns = zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')))
		for i in range(len(isbns)):
			isbns[i] = (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R')
		return isbns
		# return map(lambda i: (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R'), range(len(isbns)))

	def cleanup(self):
		self.ingestor['prereqs'] = []
		self.ingestor['coreqs'] = []
		self.ingestor['geneds'] = []
		self.ingestor['fees'] = [] # NOTE: caused issue with extractor

	@staticmethod
	def hidden_params(soup, params=None, ajax=False):
		if params is None:
			params = {}
		find = lambda tag: soup.find(tag, id=re.compile(r'win\ddivPSHIDDENFIELDS'))

		hidden = find('div')
		if not hidden:
			hidden = find('field')

		params.update({ a['name']: a['value'] for a in hidden.find_all('input') })

		if ajax:
			params.update(PeoplesoftParser.ajax_params)

		return params

	def valid_search_page(self, soup):
		# check for valid search/page
		errmsg = soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'})
		if soup.find('td', {'id' : 'PTBADPAGE_' }) or errmsg:
			if errmsg:
				if self.verbosity >= 3:
					sys.stderr.write('Error on search: {}'.format(errmsg.text))
			return False
		elif soup.find('span', {'class','SSSMSGINFOTEXT'}):
			# too many search results
			soup = self.handle_special_case_on_search(soup)

		return True

	def action(self, act):
		return {'ICAction' : self.ic_actions[act]}

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
		if self.verbosity >= 3:
			sys.stderr.write('SPECIAL SEARCH MESSAGE: {}'.format(soup.find('span', {'class','SSSMSGINFOTEXT'}).text))

		query = PeoplesoftParser.hidden_params(soup, ajax=True)
		query['ICAction'] = '#ICSave'

		return self.requester.post(self.base_url, params=query)


class QPeoplesoftParser(PeoplesoftParser):
	'''Queens modification, handles situation where initially selected term departments wont load.'''

	def __init__(self, *args, **kwargs):
		super(QPeoplesoftParser, self).__init__(*args, **kwargs)

	def parse(self, *args, **kwargs):
		soup, _ = self.goto_search_page(kwargs.get('url_params', {}))
		self.intially_selected_term = self.get_selected_term(soup)
		self.saved_dept_param_key = super(QPeoplesoftParser, self).get_dept_param_key(soup)
		self.saved_departments = super(QPeoplesoftParser, self).get_departments(soup)
		return super(QPeoplesoftParser, self).parse(*args, **kwargs)

	@staticmethod
	def get_selected_term(soup):
		for term in soup.find('select', id='CLASS_SRCH_WRK2_STRM$35$').find_all('option'):
			if term.get('selected') is not None:
				return term.text

	def get_departments(self, soup, cmd_departments):
		if self.get_selected_term(soup) == self.intially_selected_term:
			return self.saved_departments, None
		return super(QPeoplesoftParser, self).get_departments(soup)

	def get_dept_param_key(self, soup):
		if self.get_selected_term(soup) == self.intially_selected_term:
			return self.saved_dept_param_key
		return super(QPeoplesoftParser, self).get_dept_param_key(soup)


class UPeoplesoftParser(PeoplesoftParser):
	'''Modifies Peoplesoft parser to accomodate different structure (umich).'''

	def __init__(self, school, url, term_base_url=None, **kwargs):
		self.term_base_url = term_base_url # NOTE: each term has its own page that must be requested from base url
		super(UPeoplesoftParser, self).__init__(school, url, **kwargs)

	def get_departments(self, soup, cmd_departments=None):
		# extract department query list
		departments = soup.find_all('a', id=re.compile(r'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH\$\d'))
		department_names = soup.find_all('span', id=re.compile(r'M_SR_SS_SUBJECT_DESCR\$\d'))
		depts = { dept.text: dept_name.text for dept, dept_name in zip(departments, department_names) }
		dept_ids = { dept.text: dept['id'] for dept in departments }
		depts = UPeoplesoftParser.filter_departments(depts, cmd_departments)
		return depts, dept_ids

	def get_dept_param_key(self, soup):
		return 'ICAction'

	def term_update(self, term_code, params):
		# NOTE: params not used
		if self.term_base_url is None:
			self.term_base_url = self.base_url
		return self.requester.get(self.term_base_url, { 'strm': term_code })

	def get_groups(self, soup, params):
		params.update(PeoplesoftParser.hidden_params(soup, ajax=True))
		groups = soup.find_all('a', id=re.compile(r'M_SR_DERIVED2_GROUP1\$\d'))
		return { group['id']: group.text for group in groups }

	def group_update(self, group_id, params):
		params['ICAction'] = group_id
		soup = self.requester.post(self.base_url, form=params)
		return soup

	def goto_search_page(self, url_params):
		return {} # No search page

	def get_courses(self, soup):
		return soup.find_all('table', {'class' : 'PSLEVEL1GRIDROWNBO'})
