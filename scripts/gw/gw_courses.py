# @what Vanderbilt Course Parser
# @org  Semeseter.ly
# @author   Michael N. Miller
# @date 9/3/16

import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

class GWParser:

	def __init__(self):
		print UserAgent().chrome
		self.session = requests.Session()
		self.headers = {'User-Agent' : UserAgent().chrome}
		self.cookies = cookielib.CookieJar()
		self.school = 'gw'
		self.semester = ''
		self.departments = {}
		self.username = 'G45956511'
		self.password = '052698'
		self.url = 'https://banweb.gwu.edu'
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

				print 'GET', r.url

				if r.status_code == 200:
					html = r.text

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return html.encode('utf-8')

	def post_http(self, url, form, headers, payload=''):

		try:
			post = self.session.post(
				url,
				data = form,
				params = payload,
				cookies = self.cookies,
				headers = headers,
				verify = False,
			)

			print 'POST', post.url
			print post
			return post
		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None

	def login(self):
		print "Logging in..."

		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_WWWLogin')

		for cookie in self.cookies:
			print cookie.name, cookie.value

		credentials = {
			'sid' : self.username,
			'PIN' : self.password
		}

		headers = {
			# 'Connection':'keep-alive',
			# 'Content-Length':'24',
			# 'Cache-Control':'max-age=0',
			'Origin': 'https://banweb.gwu.edu',
			'Upgrade-Insecure-Requests':'1',
			'User-Agent': UserAgent().chrome,
			'Content-Type':'application/x-www-form-urlencoded',
			# 'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Referer': 'https://banweb.gwu.edu/PRODCartridge/twbkwbis.P_WWWLogin'
			# 'Accept-Encoding':'gzip, deflate, br',
			# 'Accept-Language':'en-US,en;q=0.8'
		}

		# self.post_http(self.url + '/PRODCartridge/twbkwbis.P_ValLogin', {}, credentials).text
		print self.post_http(self.url + '/PRODCartridge/twbkwbis.P_ValLogin', credentials, headers).text

		query = {
			'name' : 'bmenu.P_MainMnu',
			# 'msg' : 'WELCOME <I><b>Welcome, Rachel Presler, to the WWW Information System!</b></I>10/17/1604:54 pm',
			# 'msg' : 'WELCOME+\%3CI\%3E\%3Cb\%3EWelcome,+Rachel+Presler,+to+the+WWW+Information+System!\%3C\%2Fb\%3E\%3C\%2FI\%3E10\%2F17\%2F1604\%3A54+pm'
		}
		logged_in = self.get_html(self.url + '/PRODCartridge/twbkwbis.P_GenMenu', query)

		# print BeautifulSoup(logged_in, 'html.parser').prettify().encode('utf-8')

	def parse(self):
		self.login()

def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main()