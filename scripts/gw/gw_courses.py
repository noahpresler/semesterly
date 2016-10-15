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

class VandyParser:

	def __init__(self):
		self.session = requests.Session()
		self.headers = {'User-Agent' : 'My User Agent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.school = 'gw'
		self.semester = ''
		self.departments = {}
		self.username = 'G45956511'
		self.password = '052698'
		self.url = ''
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

			# print "POST: " + r.url
			return post
		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + sys.exc_info()[0])

		return None

	def login(self):
		print "Logging in..."

	def parse(self):
		pass

def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main()