# @what	Chapman Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/19/16

import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from scripts.peoplesoft.courses import PeopleSoftParser
from scripts.parser_library.BaseParser import CourseParser
from scripts.parser_library.internal_exceptions import CourseParseError

class ChapmanParser(PeopleSoftParser):

	def __init__(self, school, **kwargs):
		school = 'chapman'
		url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		super(ChapmanParser, self).__init__(school, url, **kwargs)

	def start(self,
		year=None,
		term=None,
		department=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		# NOTE: hardcoded semesters Fall 2016, Interim, Spring 2017
		years_and_terms = {
			"2016": {
				'Fall':'2168', 
			},
			"2017": {
				'Interim':'2172', 
				'Spring':'2174'
			}
		}

		# Selective parsing by year and term
		if term and year:
			if year not in years_and_terms:
				raise CourseParseError('year %(year)s not defined')
			if term not in years_and_terms[year]:
				raise CourseParseError('term not defined for year %(year)s')
			years_and_terms = {year: {term: years_and_terms[year][term]}}

		# Call PeopleSoft parse method
		self.parse(years_and_terms,
			department=department,
			textbooks=textbooks,
			verbosity=verbosity)

def main():
	p = ChapmanParser()
	p.start()

if __name__ == "__main__":
	main()
