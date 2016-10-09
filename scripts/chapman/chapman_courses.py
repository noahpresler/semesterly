# @what	Chapman Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	9/3/16

import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

class ChapmanParser:

	def __init__(self, sem='Fall 2016'):
		self.session = requests.Session()
		self.headers = {'User-Agent' : 'My User Agent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.school = 'chapman'
		self.semester = sem
		self.departments = {}
		self.url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		self.course = {}

	def get_html(self, url, payload=''):
		html = None
		while html is None:
			try:
				r = self.session.get(
					url,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = True
				)

				if r.status_code == 200:
					html = r.text

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return html.encode('utf-8')

	def post_http(self, url, form, payload=''):

		try:
			post = self.session.post(
				url,
				data = form,
				params = payload,
				cookies = self.cookies,
				headers = self.headers,
				verify = True,
			)

			# if r.status_code == 200:
				# post = r.text

			# print "POST: " + r.url

			return post

		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None


	def parse(self):

		soup = BeautifulSoup(self.get_html(self.url))

		# create search payload with hidden form data
		search_payload = {}
		for hidden in soup.find('div', {'id' : 'win1divPSHIDDENFIELDS'}).find_all('input'):
			search_payload[hidden['name']] = hidden['value']
		search_payload['ICAction'] = 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH'
		search_payload['SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4'] = 'N'
		for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
			search_payload['SSR_CLSRCH_WRK_' + day + '$5'] = 'Y'
			search_payload['SSR_CLSRCH_WRK_' + day + '$chk$5'] = 'Y'
		search_payload['SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5'] = 'J'

		terms = soup.find('select', {'id' : 'CLASS_SRCH_WRK2_STRM$35$'}).find_all('option')
		departments = soup.find('select', {'id' : 'SSR_CLSRCH_WRK_SUBJECT_SRCH$1'}).find_all('option')

		for term in terms:

			# first element in dropdown is empty
			if len(term['value']) <= 0:
				continue

			print term['value']

			search_payload['CLASS_SRCH_WRK2_STRM$35$'] = term['value']

			for department in departments:

				if len(department['value']) <= 0:
					continue

				print department['value']

				# Update search payload with department code
				search_payload['SSR_CLSRCH_WRK_SUBJECT_SRCH$1'] = department['value']

				# Get course listing page for department
				soup = BeautifulSoup(self.get_html(self.url, search_payload))


				# check for valid search/page
				if soup.find('td', {'id' : 'PTBADPAGE_' }) or soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
					print 'ERROR on search'
					if soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}):
						print soup.find('div', {'id' : 'win1divDERIVED_CLSMSG_ERROR_TEXT'}).text
					continue

				# fill payload for course description page request
				payload3 = {}
				for hidden in soup.find('div', {'id' : 'win1divPSHIDDENFIELDS'}).find_all('input'):
					# print hidden['name'], hidden['value']
					payload3[hidden['name']] = hidden['value']

				courses = soup.find_all('table', {'class' : 'PSLEVEL1GRIDNBONBO'})

				print len(courses)

				# for all the courses on the page
				for i in range(len(courses)):
					payload3['ICAction'] = 'MTG_CLASS_NBR$' + str(i)

					# Get course description page
					soup = BeautifulSoup(self.get_html(self.url, payload3))

					title = soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCR200'}).text
					units = soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_UNITS_RANGE'}).text
					capacity = soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_CAP'}).text
					enrollment = soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_ENRL_TOT'}).text
					waitlist = soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_WAIT_TOT'}).text
					description = soup.find('span', {'id' : 'DERIVED_CLSRCH_DESCRLONG'})
					notes = soup.find('span', {'id' : 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG'})
					info = soup.find('span', {'id' : 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'})

					scheds 	= soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
					locs 	= soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
					instrs 	= soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
					dates 	= soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))
					isbns 	= soup.find_all('span', id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*'))

					# Extract info from title
					rtitle = re.match(r'(.*) - (\d*)(.*)', title)
					code, section, name = rtitle.group(1), rtitle.group(2), rtitle.group(3).strip()

					# concatenate description, notes, and enrollment info
					description = description.text if description else ''
					description = description + ('\nEnrollment Info: ' + info.text) if info else ''
					description = description + ('\nNotes: ' + notes.text) if notes else ''

					units = re.match(r'(\d*).*', units).group(1)

					for sched, loc, instr, date in zip(scheds, locs, instrs, dates):
						print sched.text, loc.text, instr.text, date.text

						rsched = re.match(r'([a-zA-Z]*) (.*)', sched.text)
						time = rsched.group(2)
						days = re.findall('[A-Z][^A-Z]*', rsched.group(1))

						day_map = {
							'Mo' : 'M',
							'Tu' : 'T',
							'We' : 'W',
							'Th' : 'R',
							'Fr' : 'F',
							'Sa' : 'S',
							'Su' : 'U'
						}

					print name, code, section
					print units, capacity, enrollment, waitlist

					print description

				print '----------------------------------'

	def create_course():
        course, CourseCreated = Course.objects.update_or_create(
            code = courseJson['OfferingName'].strip(),
            school = 'jhu',
            campus = 1,
            defaults={
                'name': courseJson['Title'],
                'description': description,
                'areas': areas,
                'prerequisites': prereqs,
                'num_credits': num_credits,
                'level': level,
                'department': courseJson['Department']
            }
        )
        return course

def main():
	vp = ChapmanParser()
	vp.parse()

if __name__ == "__main__":
	main()