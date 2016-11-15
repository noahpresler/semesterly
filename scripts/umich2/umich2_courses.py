# @what	UMich Course Parser (Numero Duo)
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/19/16

import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from scripts.umich2.umich2_peoplesoft_temp import PeopleSoftParser

class Umich2Parser(PeopleSoftParser):

	def __init__(self):
		school = 'umich2'
		url = 'https://csprod.dsc.umich.edu/psc/csprodpa/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.M_SR_SC_CLS_SRCH.GBL'
		PeopleSoftParser.__init__(self, school, url)

	def parse(self):
		# NOTE: hardcoded semesters Fall, Interim, Spring 2016-2017
		terms = {'F':'2110', 'W':'2120'}
		PeopleSoftParser.parse(self, terms)

def main():
	p = Umich2Parser()
	p.parse()

if __name__ == "__main__":
	main()