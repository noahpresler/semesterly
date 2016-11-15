# @what	Chapman Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/19/16

import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from scripts.peoplesoft.courses import PeopleSoftParser

class ChapmanParser(PeopleSoftParser):

	def __init__(self):
		school = 'chapman'
		url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		PeopleSoftParser.__init__(self, school, url)

	def parse(self):
		# NOTE: hardcoded semesters Fall, Interim, Spring 2016-2017
		terms = {'F':'2168', 'I':'2172', 'S':'2174'}
		PeopleSoftParser.parse(self, terms)

def main():
	p = ChapmanParser()
	p.parse()

if __name__ == "__main__":
	main()
