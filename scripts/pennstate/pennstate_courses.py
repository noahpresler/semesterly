# @what	PennState Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/21/16

import django, os, re
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from scripts.peoplesoft.courses import PeopleSoftParser

class PennStateParser(PeopleSoftParser):

	def __init__(self):
		school = 'pennstate'
		url = 'https://public.lionpath.psu.edu/psc/CSPRD/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		PeopleSoftParser.__init__(self, school, url)

	def parse(self):

		# NOTE: hardcoded semesters Fall, Spring 2016-2017
		terms = {'F':'2168', 'S':'2171'}

		search_page_params = {	
			'PORTALPARAM_PTCNAV':'HC_CLASS_SEARCH_GBL',
			'EOPP.SCNode':'HRMS',
			'EOPP.SCPortal':'EMPLOYEE',
			'EOPP.SCName':'CO_EMPLOYEE_SELF_SERVICE',
			'EOPP.SCLabel':'Self Service',
			'EOPP.SCPTfname':'CO_EMPLOYEE_SELF_SERVICE',
			'FolderPath':'PORTAL_ROOT_OBJECT.CO_EMPLOYEE_SELF_SERVICE.HC_CLASS_SEARCH_GBL',
			'IsFolder':'false',
			'PortalActualURL':'https://public.lionpath.psu.edu/psc/CSPRD/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL',
			'PortalContentURL':'https://public.lionpath.psu.edu/psc/CSPRD/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL',
			'PortalContentProvider':'HRMS',
			'PortalCRefLabel':'Class Search',
			'PortalRegistryName':'EMPLOYEE',
			'PortalServletURI':'https://public.lionpath.psu.edu/psp/CSPRD/',
			'PortalURI':'https://public.lionpath.psu.edu/psc/CSPRD/',
			'PortalHostNode':'HRMS',
			'NoCrumbs':'yes',
			'PortalKeyStruct':'yes'
		}

		PeopleSoftParser.parse(self, terms, 
			url_params=search_page_params,
			department_regex=re.compile(r'\S+\s+?-\s+?(.*)')
		)

def main():
	p = PennStateParser()
	p.parse()

if __name__ == "__main__":
	main()