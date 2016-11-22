import django, os, datetime, requests, cookielib, re, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from itertools import izip
from bs4 import BeautifulSoup

class UmichEvals:

	def __init__(self, school, url):
		self.session = requests.Session()
		# self.headers = {'User-Agent' : UserAgent().random} # why does this not work anymore?
		self.headers = {'User-Agent' : 'UserAgent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.base_url = url
		self.school = school
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

				# print GET, r.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]) + '\n')
				raw_input("Press Enter to continue...")
				html = None

		return html.encode('utf-8')

	def post_http(self, url, form, payload=''):

		post = None
		while post is None:
			try:
				post = self.session.post(
					url,
					data = form,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = True,
				)

				# print POST, r.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]) + '\n')
				raw_input("Press Enter to continue...")
				post = None

		return post

	def parse():
		
		login_url = 'LOGIN_URL'

		soup = BeautifulSoup(self.get_html(login_url), 'html.parser')
