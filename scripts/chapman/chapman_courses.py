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
import dryscrape, urllib

class ChapmanParser:

	def __init__(self, sem='Fall 2016'):
		self.dry = dryscrape.Session()
		self.session = requests.Session()
		self.headers = {'User-Agent' : 'My User Agent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.school = 'vandy'
		self.semester = sem
		self.departments = {}
		self.url = 'https://webapp.mis.vanderbilt.edu/more'
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
				# allow_redirects=False
			)

			return post
			# if r.status_code == 200:
				# post = r.text

			# print "POST: " + r.url

		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + sys.exc_info()[0])

		return None


	def parse(self):

		url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'

		payload = {
			'PORTALPARAM_PTCNAV' : 'XC_GUEST_CLASS_SCHEDULE',
			'EOPP.SCNode' : 'EMPL',
			'EOPP.SCPortal' : 'EMPLOYEE',
			'EOPP.SCName' : 'ADMN_SEARCH_FOR_CLASSES__GUES',
			'EOPP.SCLabel' : '',
			'EOPP.SCPTcname' : 'PT_PTPP_SCFNAV_BASEPAGE_SCR',
			'FolderPath' : 'PORTAL_ROOT_OBJECT.PORTAL_BASE_DATA.CO_NAVIGATION_COLLECTIONS.ADMN_SEARCH_FOR_CLASSES__GUES.ADMN_S201505070932101643447597',
			'IsFolder' : 'false'
		}

		self.dry.visit(url + '?' + urllib.urlencode(payload))
		print self.dry.body()

		soup = BeautifulSoup(self.get_html(url, payload), 'html.parser')
		terms = soup.find('select', {'id' : 'CLASS_SRCH_WRK2_STRM$35$'}).find_all('option')
		for term in terms:
			print term['value']
			subjects = soup.find('select', {'id' : 'SSR_CLSRCH_WRK_SUBJECT_SRCH$1'}).find_all('option')
			for subject in subjects:
				print subject['value']

				payload2 = {
					'ICAJAX' : '1',
					'ICNAVTYPEDROPDOWN' : '0',
					'ICType' : 'Panel',
					'ICElementNum' : '1',
					'ICStateNum' : '1',
					'ICAction' : 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH',
					'ICXPos' : '0',
					'ICYPos' : '0',
					'ResponsetoDiffFrame' : '-1',
					'TargetFrameName' : 'None',
					'FacetPath' : 'None',
					'ICSaveWarningFilter' : '0',
					'ICChanged' : '-1',
					'ICResubmit' : '0',
					'ICSID' : 'Hqi51N4T3kp8zt91dvHl/c4Rdyxy4A7jq8EZ/EfEm4k=',
					'ICActionPrompt' : 'false',
					'CLASS_SRCH_WRK2_STRM$35$' : term['value'],
					'SSR_CLSRCH_WRK_SUBJECT_SRCH$1' : subject['value'],
				}

				soup = BeautifulSoup(self.get_html(url, payload2))




def main():
	vp = ChapmanParser()
	vp.parse()

if __name__ == "__main__":
	main()