# @what     Bkstr.com generalized scraper.
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     2/10/17

from __future__ import print_function # NOTE: slowly move toward Python3

import re, simplejson as json

from scripts.parser_library.base_parser import BaseParser
from scripts.textbooks.amazon import amazon_textbook_fields

class BkstrDotComParser(BaseParser):
	def __init__(self, school, store_id, **kwargs):
		self.school = school
		self.store_id = store_id
		self.url = 'http://www.bkstr.com/webapp/wcs/stores/servlet/'
		super(BkstrDotComParser, self).__init__(school, **kwargs)

	def start(self, 
		verbosity=3,
		year=None,
		term=None,
		department=None,
		**kwargs):

		print('Parsing bkstr.com for {}'.format(self.school))

		# Retrieve cookies
		self.requester.get('http://www.bkstr.com')

		query = {
			'storeId':self.store_id,
			'demoKey':'d',
			'requestType':'INITIAL',
			'_': ''
		}

		programs = self.extract_json(query)
		for program, program_code in programs.items():
			query['programId'] = programs[program]
			query['requestType'] = 'TERMS'
			term_and_years = self.extract_json(query)
			years = BkstrDotComParser.parse_term_and_years(term_and_years)
			for year, terms in years.items():
				print('>\tParsing textbooks in year', year)
				self.ingestor['year'] = year
				for term, term_code in terms.items():
					print('>>\tParsing textbooks in term {} {}'.format(year, term))
					self.ingestor['term'] = term
					query['termId'] = term_code
					query['requestType'] = 'DEPARTMENTS'
					depts = self.extract_json(query)
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

		self.ingestor.wrap_up()

	def extract_json(self, query):
		return json.loads(re.search(r'\'(.*)\'', self.requester.get('{}/LocateCourseMaterialsServlet'.format(self.url), query, parse=False).text).group(1))['data'][0]

	@staticmethod
	def parse_term_and_years(term_and_years):
			years = { term_and_year.split()[1]: {term_and_year.split()[0]: code} for term_and_year, code in term_and_years.items() }
			for year in years:
				years[year].update({term_and_year.split()[0].title(): code for term_and_year, code in term_and_years.items() if term_and_year.split()[1] == year})
			return years
