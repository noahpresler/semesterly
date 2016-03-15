import sys
import requests, cookielib
from bs4 import BeautifulSoup
import re
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from collections import OrderedDict

'''#==========================================FOR PRODUCTION USE======================================
chrome_options = Options()
chrome_options.add_argument("--disable-extensions")

display=Display(visible=0, size=(800, 600))
display.start()

# If the Chrome Webdriver is not already in your $PATH, change this to
# represent its filepath
WEBDRIVER_CHROME = '/root/chromedriver_executable/chromedriver' # e.g. '/home/linoah/chromedriver'
#====================================================================================================='''


#===========================================FOR DEVELOPMENT USE=======================================
WEBDRIVER_CHROME = None
#=====================================================================================================

class ottowa_parser:

	def safe_print(self,to_print):
		try:
			print to_print
		except UnicodeEncodeError:
			print "Print statement omitted for UnicodeEncodeError."

	def __init__(self):
		self.s = requests.Session()
		self.cookies = cookielib.CookieJar()
		self.headers = {
			'User-Agent': 'My User Agent 1.0'
		}
		self.detail_base_url = "https://web30.uottawa.ca/v3/SITS/timetable/"
		self.base_url = "https://web30.uottawa.ca/v3/SITS/timetable/SearchResults.aspx"
		if len(sys.argv) != 2 or (sys.argv[1] != "winter" and sys.argv[1] != "fall"):
			self.safe_print("You must supply a semester either winter or fall to parse.")
			exit()
		elif len(sys.argv) == 2:
			self.semester = str(sys.argv[1])
		self.safe_print("Parsing Data For: " + self.semester + " Semester")
		if not WEBDRIVER_CHROME:
			self.driver = webdriver.Chrome()
		else:
			self.driver = webdriver.Chrome(WEBDRIVER_CHROME)
		self.driver.get(self.base_url)
		self.sem_value = "20161"

	def row_cond(self,x):
		if x:
			return x not in ["results-header","footer","hidden-header"]
		else:
			return False

	def detail_row_cond(self,x):
		if x:
			return x not in ["first-element","footer","hidden-header"]
		else:
			return False

	def get_search_results_html(self):
		if self.semester == "winter":
			while True:
					try:
						selector = Select(self.driver.find_element_by_id("ctl00_MainContentPlaceHolder_Basic_SessionDropDown"))
						#BE SURE TO CHANGE THIS VALUE
						selector.select_by_value(self.sem_value)
						break
					except Exception,e:
						print str(e)
						self.safe_print("Waiting for page load")
		self.safe_print("Term Has Been Selected")
		self.driver.find_element_by_id("ctl00_MainContentPlaceHolder_Basic_Button").click()
		while True:
			try:
				self.driver.find_element_by_id("main-content")
				break
			except:
				self.safe_print("Waiting for page load")
		return self.driver.page_source

	def parse_page_results(self,page_html):
		soup = BeautifulSoup(page_html)
		table = soup.find('table', class_="result-table")
		rows = table.findAll('tr', {'class': self.row_cond})
		for row in rows:
			self.parse_course_row(row)

	def to_cookielib_cookie(self,selenium_cookie):
		return cookielib.Cookie(
			version=0,
			name=selenium_cookie['name'],
			value=selenium_cookie['value'],
			port='80',
			port_specified=False,
			domain=selenium_cookie['domain'],
			domain_specified=True,
			domain_initial_dot=False,
			path=selenium_cookie['path'],
			path_specified=True,
			secure=selenium_cookie['secure'],
			expires=False,
			discard=False,
			comment=None,
			comment_url=None,
			rest=None,
			rfc2109=False
	    )

	def put_cookies_in_jar(self, selenium_cookies, cookie_jar):
		cookie_jar.clear()
		for cookie in selenium_cookies:
			cookie_jar.set_cookie(self.to_cookielib_cookie(cookie))

	def parse_course_row(self,row):
		code = self.get_course_code(row)
		title = self.get_course_title(row)
		url = self.get_detail_link(row)
		sections = self.get_details(url)
		print "Course: " + code

	def get_details(self,url):
		self.put_cookies_in_jar(self.driver.get_cookies(),self.cookies)
		self.headers = {
			'Referer' : 'https://web30.uottawa.ca/v3/SITS/timetable/SearchResults.aspx'
		}
		html = self.get_html(url)
		soup = BeautifulSoup(html)
		sections_tables = soup.findAll('table',class_="display")
		sections = []
		for section_table in sections_tables:
			rows = section_table.findAll('tr', {'class': self.detail_row_cond})
			section_id = rows[0].find('td', class_="Section").text
			for row in rows:
				date_time = row.find(class_="Day").text
				place = row.find(class_="Place").text
				prof = row.find(class_="Professor").text
				sections.append(OrderedDict([
						("id", section_id),
						("date-time",date_time),
						("location", place),
						("Professor", prof)
					]))
				print "Section: " + section_id + date_time + " " + place + " " + prof 
		return sections



	def get_detail_link(self,row):
		return self.detail_base_url+row.find('a')['href']

	def get_course_code(self,row):
		return row.find(class_="CourseCode").text

	def get_course_title(self,row):
		return row.find(class_="CourseTitle").text

	def parse_courses(self):
		html = self.get_search_results_html()
		while True:
			self.parse_page_results(html)
			self.driver.execute_script("__doPostBack('ctl00$MainContentPlaceHolder$ctl03','')")
			html = self.driver.page_source

	def get_html(self, url):
		html = None
		while html is None:
			try:
				r = self.s.get(url,cookies=self.cookies,headers=self.headers)
				if r.status_code == 200:
					html = r.text
			except (requests.exceptions.Timeout,
					requests.exceptions.ConnectionError):
				print "Unexpected error:", sys.exc_info()[0]
				
				continue
		return html.encode('utf-8')

ott = ottowa_parser()
ott.parse_courses()