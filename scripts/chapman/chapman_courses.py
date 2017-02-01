# @what	Chapman Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/19/16

import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from scripts.peoplesoft.courses import PeopleSoftParser

class ChapmanParser(PeopleSoftParser):

	def __init__(self, **kwargs):
		school = 'chapman'
		url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		PeopleSoftParser.__init__(self, school, url, **kwargs)

	def parse(self):
		# NOTE: hardcoded semesters Fall, Interim, Spring 2016-2017
		terms = {
			"2016": {
				'Fall':'2168', 
			},
			"2017": {
				'Interim':'2172', 
				'Spring':'2174'
			}
		}

		if 'term_and_year' in self.options:
			term = self.options['term_and_year'][0]
			year = self.options['term_and_year'][1]
			if year not in terms:
				raise CourseParserError('year %(year)s not defined')
			if term not in terms[year]:
				raise CourseParserError('term not defined for year %(year)s')
			terms = {year: {term: terms[year][term]}}

		PeopleSoftParser.parse(self, terms)

def main():
	p = ChapmanParser()
	p.parse()

if __name__ == "__main__":
	main()
