import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys
from itertools import izip

class GWTextbooks:

	def __init__(self):
		self.session = requests.Session()
		self.headers = {'User-Agent' : UserAgent().chrome}
		self.cookies = cookielib.CookieJar()
		self.url = 'http://www.bkstr.com/webapp/wcs/stores/servlet'
		self.store_id = '10370'

	def direct(self):

		soup = BeautifulSoup(self.get_html(self.url + '/LocateCourseMaterialsView', {'storeId':self.store_id}), 'html.parser')

		programs = soup.find('select', id='programIdSelect').find_all('option')

		for program in programs:

			query = {
				'requestType':'COURSES',
				'storeId':self.store_id,
				'demoKey':'d',
				'programId':program['value'],
				'divisionName':' ',
				'departmentName':'ANTH',
			}

			# select term
			terms = soup.find('select', id='termIdSelect').find_all('option')
			print terms
			for term in terms:
				query['termId'] = term['value']
				depts = self.get_html(self.url + '/LocateCourseMaterialsServlet', query)
				print depts
				exit(1)

				for dept in depts:
					query['departmentName'] = dept['value']
					courses = BeautifulSoup(self.get_html(self.url + '/LocateCourseMaterialsServlet', query), 'html.parser').find_all('select', id='courseIdSelect')

					for course in courses
						query['courseName'] = course['value']
						sections = BeautifulSoup(self.get_html(self.url + '/LocateCourseMaterialsServlet', query), 'html.parser').find_all('select', id='sectionIdSelect')

						for section in sections
							query['sectionName'] = section['value']
							BeautifulSoup(self.get_html(self.url + '/LocateCourseMaterialsServlet', query), 'html.parser')

							exit(1)

	# REQUESTS
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

				# print 'GET', r.url

				if r.status_code == 200:
					html = r.text

				return html

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return None

	def post_http(self, url, form, payload=''):
		p = None
		while p is None:
			try:
				post = self.session.post(
					url,
					data = form,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = False,
				)

				if post.status_code == 200:
					p = post

				# print 'POST', post.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return p
