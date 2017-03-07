# @what   Queens Course Parser
# @org    Semeseter.ly
# @author Noah Presler & Michael N. Miller
# @date   2/15/17

from __future__ import print_function # NOTE: slowly move toward Python3

import socket
from selenium import webdriver
from selenium.webdriver.support.ui import Select

from scripts.peoplesoft.courses import QPeoplesoftParser

class QueensParser(QPeoplesoftParser):

	BASE_URL = 'https://saself.ps.queensu.ca/psc/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL'
	
	# TODO - should not be visible in parser
	USER = '1dc4'
	PASS = '***REMOVED***'

	def __init__(self, **kwargs):
		params = {
			'Page': 'SSR_CLSRCH_ENTRY',
			'Action': 'U',
			'ExactKeys': 'Y',
			'TargetFrameName': 'None'
		}
		self.cap = webdriver.DesiredCapabilities.PHANTOMJS
		self.cap["phantomjs.page.settings.resourceTimeout"] = 50000000
		self.cap["phantomjs.page.settings.loadImages"] = False
		self.cap["phantomjs.page.settings.userAgent"] = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:16.0) Gecko/20121026 Firefox/16.0'
		self.driver = webdriver.PhantomJS('./node_modules/phantomjs-prebuilt/bin/phantomjs',desired_capabilities=self.cap)
		# self.driver = webdriver.Chrome() #FOR DEBUG PURPOSES ONLY

		super(QueensParser, self).__init__('queens', QueensParser.BASE_URL, url_params=params, **kwargs)

	def seleni_run(self, code):
		while True:
			try:
				return code()
			except:
				continue

	def focus_iframe(self):
		iframe = self.seleni_run(lambda: self.driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
		self.driver.switch_to_frame(iframe)

	def login(self):
		socket.setdefaulttimeout(60)
		self.driver.set_page_load_timeout(30)
		self.driver.implicitly_wait(30)
		self.driver.get('https://my.queensu.ca/')
		self.seleni_run(lambda: self.driver.find_element_by_id('username').send_keys('1dc4'))
		self.seleni_run(lambda: self.driver.find_element_by_id('password').send_keys('***REMOVED***'))
		self.seleni_run(lambda: self.driver.find_element_by_class_name('form-button').click())
		self.seleni_run(lambda: self.driver.find_element_by_link_text("SOLUS").click())
		self.focus_iframe()
		self.seleni_run(lambda: self.driver.find_element_by_link_text("Search").click())

		# transfer Selenium cookies to Requester cookies
		for cookie in self.driver.get_cookies():
		    c = {cookie['name']: cookie['value']}
		    self.requester.session.cookies.update(c)

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

		self.requester.headers = headers

		# NOTE: get request will update CookieJar
		self.requester.get('https://saself.ps.queensu.ca/psc/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?Page=SSR_CLSRCH_ENTRY&Action=U&ExactKeys=Y&TargetFrameName=None')

		self.driver.close()

	def start(self,
		years=None,
		terms=None,
		departments=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		if verbosity >= 1:
			print('Logging in')

		self.login()

		if verbosity >= 1:
			print('Completed login')

		self.parse(
			cmd_years=years,
			cmd_terms=terms,
			cmd_departments=departments,
			cmd_textbooks=textbooks,
			verbosity=verbosity)

if __name__ == "__main__":
	raise NotImplementedError('run with manage.py')
