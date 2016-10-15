# @what	Vanderbilt Course Parser
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

class GWParser:

	def __init__(self):
		self.session = requests.Session()
		self.headers = {'User-Agent' : 'My User Agent 1.0'}
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

				print r.url

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

			# print "POST: " + r.url
			return post
		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None

	def login(self):
		print "Logging in..."

		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_WWWLogin') 
		credentials = {
			'sid' : self.username,
			'PIN' : self.password,
			# 'submit' : 'Login',
			# 'loginform' : ''
		}
		query = {
			'name' : 'bmenu.P_MainMnu',
			'msg' : "WELCOME+<I><b>Welcome,+Rachel+Presler,+to+the+WWW+Information+System!</b></I>10/14/1611:15+pm"
		}
		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_GenMenu', query)
		print self.post_http(self.url + '/PRODCartridge/twbkwbis.P_ValLogin', credentials).text
		# print BeautifulSoup(self.url + '/PRODCartridge/twbkwbis.P_GenMenu?name=bmenu.P_MainMnu', 'html.parser').prettify()

	def parse(self):
		self.login()
		pass

def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main() 