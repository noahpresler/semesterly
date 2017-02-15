# @what	Chapman Course Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	9/3/16

import django, os, datetime, pprint
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

from amazonproduct import API
api = API(locale='us')

from selenium import webdriver
from selenium.webdriver.support.ui import Select

cap = webdriver.DesiredCapabilities.PHANTOMJS
cap["phantomjs.page.settings.resourceTimeout"] = 50000000
cap["phantomjs.page.settings.loadImages"] = False
cap["phantomjs.page.settings.userAgent"] = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:16.0) Gecko/20121026 Firefox/16.0'
driver = webdriver.PhantomJS('./node_modules/phantomjs-prebuilt/bin/phantomjs',desired_capabilities=cap)

class QueensParser:

	SCHOOL = 'queens2'
	BASE_URL = 'https://saself.ps.queensu.ca/psp/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL'
	HEADERS = {'User-Agent' : 'My User Agent 1.0'}
	DAY_MAP = {
		'Mo' : 'M',
		'Tu' : 'T',
		'We' : 'W',
		'Th' : 'R',
		'Fr' : 'F',
		'Sa' : 'S',
		'Su' : 'U'
	}
	USER = '1dc4'
	PASS = '***REMOVED***'

	def __init__(self):
		self.course = {}
		self.session = requests.Session()
		self.cookies = cookielib.CookieJar()

	def get_html(self, url, payload='', headers=HEADERS):
		html = None
		while html is None:
			try:
				r = self.session.get(
					url,
					params = payload,
					headers = headers,
					verify = True
				)

				if r.status_code == 200:
					html = r.text

				# print GET, r.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return html.encode('utf-8')

	def post_http(self, url, form, payload='', headers=HEADERS):

		try:
			post = self.session.post(
				url,
				data = form,
				params = payload,
				headers = headers,
				verify = True,
			)

			# print POST, r.url

			return post

		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None

	def seleni_run(self, code):
		while True:
			try:
				return code()
				break
			except:
				import traceback
				traceback.print_exc()
				exit()
				continue

	def focus_iframe(self):
		iframe = self.seleni_run(lambda: driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
		driver.switch_to_frame(iframe)

	def parse(self):
		import socket
		socket.setdefaulttimeout(60)
		driver.set_page_load_timeout(30)
		driver.implicitly_wait(30)
		print "GETTING"
		driver.get('https://my.queensu.ca/')
		print 1 
		self.seleni_run(lambda: driver.find_element_by_id('username').send_keys('1dc4'))
		self.seleni_run(lambda: driver.find_element_by_id('password').send_keys('***REMOVED***'))
		print "clicking"
		self.seleni_run(lambda: driver.find_element_by_class_name('Btn1Def').click())
		print 4
		self.seleni_run(lambda: driver.find_element_by_link_text("SOLUS").click())
		print "ON SOLUS"
		self.focus_iframe()
		self.seleni_run(lambda: driver.find_element_by_link_text("Search").click())
		print "ON SEARCH"


		for cookie in driver.get_cookies():
		    c = {cookie['name']: cookie['value']}
		    self.session.cookies.update(c)

		headers = {
		    'Pragma': 'no-cache',
		    'Accept-Encoding': 'gzip, deflate, sdch, br',
		    'Accept-Language': 'en-US,en;q=0.8',
		    'Upgrade-Insecure-Requests': '1',
		    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
		    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		    'Referer': 'https://saself.ps.queensu.ca/psc/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?PortalActualURL=https%3a%2f%2fsaself.ps.queensu.ca%2fpsc%2fsaself%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentURL=https%3a%2f%2fsaself.ps.queensu.ca%2fpsc%2fsaself%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fsaself.ps.queensu.ca%2fpsp%2fsaself%2f&PortalURI=https%3a%2f%2fsaself.ps.queensu.ca%2fpsc%2fsaself%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes',
		    'Connection': 'keep-alive',
		    'Cache-Control': 'no-cache',
		}
		print self.get_html('https://saself.ps.queensu.ca/psc/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?Page=SSR_CLSRCH_ENTRY&Action=U&ExactKeys=Y&TargetFrameName=None', headers=headers)


def main():
	p = QueensParser()
	p.parse()

if __name__ == "__main__":
	main()