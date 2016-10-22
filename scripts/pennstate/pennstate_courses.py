# @what	PennState Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	10/21/16

import django, os, datetime, requests, cookielib, re, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip
from bs4 import BeautifulSoup

from scripts.textbooks.amazon import make_textbook
from scripts.peoplesoft.courses import PeopleSoftParser

class PennStateParser(PeopleSoftParser):

	def __init__(self):
		school = 'pennstate'
		url = 'https://public.lionpath.psu.edu/psc/CSPRD/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		PeopleSoftParser.__init__(self, school, url)

	def parse(self):

		# NOTE: hardcoded semesters Fall, Interim, Spring 2016-2017
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

		# PeopleSoftParser.parse(self, terms, url_params=search_page_params)

		# exit(0)

		soup = BeautifulSoup(self.get_html(self.base_url, search_page_params))
		# print soup.prettify()

		# create search payload with hidden form data
		search_query = {a['name']: a['value'] for a  in soup.find('div', id=re.compile(r'win\ddivPSHIDDENFIELDS')).find_all('input')}
		search_query['ICAction'] = 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH'
		search_query['SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4'] = 'N'
		for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
			search_query['SSR_CLSRCH_WRK_' + day + '$5'] = 'Y'
			search_query['SSR_CLSRCH_WRK_' + day + '$chk$5'] = 'Y'
		search_query['SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5'] = 'J'

		# print search_query

		# extract search query info
		departments = soup.find('select', id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d')).find_all('option')[1:]
		# NOTE: first element of dropdown lists in search area is empty

		for term in terms:

			print 'Parsing courses for', term

			self.course['semester'] = term

			# update search payload with term as parameter
			search_query['CLASS_SRCH_WRK2_STRM$35$'] = terms[term]

			for department in departments:

				print '> Parsing courses in department', department.text

				self.course['department'] = department.text

				# Update search payload with department code
				search_query['SSR_CLSRCH_WRK_SUBJECT_SRCH$2'] = department['value']

				# Get course listing page for department
				soup = BeautifulSoup(self.post_http(self.base_url, search_query).text, 'html.parser')

				# check for valid search/page
				if soup.find('td', {'id' : 'PTBADPAGE_' }) or soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
					if soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
						print 'Error on search: ' + soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}).text
					continue

				# fill payload for course description page request
				descr_payload = {a['name']: a['value'] for a in soup.find('div', {'id' : 'win0divPSHIDDENFIELDS'}).find_all('input')}

				courses = soup.find_all('table', {'class' : 'PSLEVEL1GRIDNBONBO'})

				# for all the courses on the page
				for i in range(len(courses)):
					descr_payload['ICAction'] = 'MTG_CLASS_NBR$' + str(i)

					# Get course description page
					soup = BeautifulSoup(self.get_html(self.base_url, descr_payload))

					# scrape info from page
					title 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCR200'}).text
					units 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_UNITS_RANGE'}).text
					capacity 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_CAP'}).text
					enrollment 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_TOT'}).text
					waitlist 	= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_WAIT_TOT'}).text
					descr 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCRLONG'})
					notes 		= soup.find('span', {'id' : 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG'})
					info 		= soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'})

					# parse table of times
					scheds 	= soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
					locs 	= soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
					instrs 	= soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
					dates 	= soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))

					# parse textbooks
					isbns 	= self.parse_textbooks(soup)

					# Extract info from title
					print '\t' + title
					rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title.encode('ascii', 'ignore'))

					# Place course info into course model
					self.course['code'] 	= rtitle.group(1)
					self.course['section'] 	= rtitle.group(2)
					self.course['name'] 	= rtitle.group(3)
					self.course['credits']	= float(re.match(r'(\d*).*', units).group(1))
					self.course['descr'] 	= self.extract_prereqs(descr.text) if descr else ''
					self.course['notes'] 	= self.extract_prereqs(notes.text) if notes else ''
					self.course['info'] 	= self.extract_prereqs(info.text) if info else ''
					self.course['units'] 	= re.match(r'(\d*).*', units).group(1)
					self.course['size'] 	= int(capacity)
					self.course['enrolment'] = int(enrollment)
					self.course['instrs'] = ', '.join({instr.text for instr in instrs})

					course = self.create_course()
					section = self.create_section(course)

					# create textbooks
					map(lambda isbn: make_textbook(isbn[1], isbn[0], section), isbns)

					# offering details
					for sched, loc, date in izip(scheds, locs, dates):

						rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)

						if rsched:
							days = map(lambda d: PeopleSoftParser.DAY_MAP[d], re.findall('[A-Z][^A-Z]*', rsched.group(1)))
							time = (PeopleSoftParser.time_12to24(rsched.group(2)), PeopleSoftParser.time_12to24(rsched.group(3)))
						else: # handle TBA classes
							days = None
							time = (None, None)

						self.course['time_start'] = time[0]
						self.course['time_end'] = time[1]
						self.course['location'] = loc.text
						self.course['days'] = days

						self.create_offerings(section)

			PennStateParser.wrap_up()

	def parse_textbooks(self, soup):
		isbns = zip(soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')), soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')))
		for i in range(len(isbns)):
			isbns[i] = (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R')
		return isbns
		# return map(lambda i: (filter(lambda x: x.isdigit(), isbns[i][0].text), isbns[i][1].text[0].upper() == 'R'), range(len(isbns)))

	# NOTE: chapman specific
	def extract_prereqs(self, text):

		extractions = {
			'prereqs' : r'Prerequisite(?:s?)[:,]\s(.*?)\.',
			'coreqs'  : r'Corequisite(?:s?)[:,]\s(.*?)\.'
		}

		for ex in extractions:
			rex = re.compile(extractions[ex])
			extracted = rex.search(text)
			if extracted:
				self.course[ex] = extracted.group(1)
			else:
				self.course[ex] = ''
			text = rex.sub('', text).strip()

		return text


def main():
	p = PennStateParser()
	p.parse()

if __name__ == "__main__":
	main()