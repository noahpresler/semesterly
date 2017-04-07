# @what     Bkstr.com generalized scraper.
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     2/10/17

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import re, sys, simplejson as json

from scripts.textbooks.amazon import amazon_textbook_fields
from scripts.parser_library.base_parser import BaseParser

class BkstrDotComParser(BaseParser):
	def __init__(self, school, store_id, **kwargs):
		self.school = school
		self.store_id = store_id
		self.url = 'http://www.bkstr.com/webapp/wcs/stores/servlet/'
		super(BkstrDotComParser, self).__init__(school, **kwargs)

	def start(self, 
		verbosity=3,
		years=None,
		terms=None,
		departments=None,
		**kwargs):

		cmd_years = years
		cmd_terms = terms
		cmd_departments = departments

		print('Parsing bkstr.com for {}'.format(self.school))

		# Retrieve cookies from home website.
		self.requester.get('http://www.bkstr.com')

		query = {
			'storeId':self.store_id,
			'demoKey':'d',
			'requestType':'INITIAL',
			'_': ''
		}

		# TODO - fix requester issues by refreshing cookies on timeout

		programs = self.extract_json(query)
		for program, program_code in programs.items():
			query['programId'] = programs[program]
			query['requestType'] = 'TERMS'
			terms_and_years = self.extract_json(query)
			years = self.parse_terms_and_years(terms_and_years)
			years_and_terms = self.extractor.filter_term_and_year(years, cmd_years, cmd_terms)
			for year, terms in years_and_terms.items():
				print('>\tParsing textbooks in year', year)
				self.ingestor['year'] = year
				for term, term_code in terms.items():
					print('>>\tParsing textbooks in term {} {}'.format(year, term))
					self.ingestor['term'] = term
					query['termId'] = term_code
					query['requestType'] = 'DEPARTMENTS'
					depts = self.extractor.filter_departments(self.extract_json(query), cmd_departments)
					for dept, dept_code in depts.items():
						print('>>>\tParsing textbooks for {} {} {}'.format(term, year, dept))
						query['departmentName'] = dept_code
						query['requestType'] = 'COURSES'
						courses = self.extract_json(query)
						for course, course_code in courses.items():
							print('>>>>\tParsing textbooks for {} {} {} {}'.format(term, year, dept, course))
							self.ingestor['course_code'] = '{} {}'.format(dept, course)
							query['courseName'] = courses[course]
							query['requestType'] = 'SECTIONS'
							sections = self.extract_json(query)
							for section, section_code in sections.items():
								print('>>>>>\tParsing textbooks for {} {} {} {} {}'.format(term, year, dept, course, section))
								self.ingestor['section_code'] = section

								query2 = {
									'categoryId': '9604',
									'storeId': self.store_id,
									'langId': '-1',
									'programId': program_code,
									'termId': term_code,
									'divisionDisplayName':' ',
									'departmentDisplayName': dept_code,
									'courseDisplayName': course_code,
									'sectionDisplayName': section_code,
									'demoKey': 'd',
									'purpose': 'browse'
								}

								soup = self.requester.get('{}/CourseMaterialsResultsView'.format(self.url), query2)

								materials = soup.find_all('li', {'class':'material-group'})
								for material in materials:
									self.ingestor['required'] = re.match('material-group_(.*)', material['id']).group(1) == 'REQUIRED'
									books = material.find_all('ul')
									for book in books:
										isbn = book.find('span', id='materialISBN')
										isbn.find('strong').extract()
										isbn = isbn.text.strip()
										self.ingestor['isbn'] = str(isbn)
										self.ingestor.update(amazon_textbook_fields(isbn))
										self.ingestor.ingest_textbook()
										self.ingestor.ingest_textbook_link()

	def extract_json(self, query):
		'''Bkstr.com return response as json but labels it as html.'''
		return json.loads(re.search(r'\'(.*)\'', self.requester.get('{}/LocateCourseMaterialsServlet'.format(self.url), query, parse=False).text).group(1))['data'][0]

	@staticmethod
	def parse_terms_and_years(term_and_years):
			years = { term_and_year.split()[1]: {} for term_and_year, code in term_and_years.items() }
			# Create nesting based on year.
			for year in years:
				years[year].update({term_and_year.split()[0].title(): code for term_and_year, code in term_and_years.items() if term_and_year.split()[1] == year})
			return years
