import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys
from itertools import izip
import json

class GWTextbooks:

	def __init__(self):
		self.session = requests.Session()
		self.headers = {'User-Agent' : UserAgent().random}
		self.cookies = cookielib.CookieJar()
		self.url = 'http://www.bkstr.com/webapp/wcs/stores/servlet'
		self.store_id = '10370'

	def direct(self):

		self.get_jsessionid()

		query = {
			'storeId':self.store_id,
			'demoKey':'d',
			'divisionName':' ',
			'_': ''
		}

		programs = {'270'} # NOTE: hardcoded
		for program in programs:
			query['programId'] = program

			terms = {'100041961', '100044854'} # NOTE: hardcoded
			for term in terms:
				query['termId'] = term
				query['requestType'] = 'DEPARTMENTS'

				# print term

				depts = json.loads(re.search(r'\'(.*)\'', self.get_http(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]
				for dept in depts:
					query['departmentName'] = dept
					query['requestType'] = 'COURSES'

					# print dept

					courses = json.loads(re.search(r'\'(.*)\'', self.get_http(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]
					for course in courses:
						query['courseName'] = course
						query['requestType'] = 'SECTIONS'

						# print course

						sections = json.loads(re.search(r'\'(.*)\'', self.get_http(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]
						for section in sections:

							# print section
							query2 = {
								'catalogId':'10002',
								'categoryId':'null',
								'storeId':self.store_id,
								'langId':'null',
								'programId':program,
								'termId':term,
								'divisionDisplayName':' ',
								'departmentDisplayName':dept,
								'courseDisplayName':course,
								'sectionDisplayName':'82',
								'demoKey':'d',
								'purpose':'browse'
							}
							
							import sys

							orig_stdout = sys.stdout
							f = file('gw_tbks_js_dump.html', 'w')
							sys.stdout = f

							print BeautifulSoup(self.get_http(self.url + '/CourseMaterialsResultsView', query2).text, 'html.parser').prettify()
							exit(0)

	def get_jsessionid(self):

		JSESSIONID = re.search(r'JSESSIONID=(.*?);', self.get_http('http://www.bkstr.com/').text).group(1)

		cookie = cookielib.Cookie(
			version=0, 
			name='JSESSIONID',
			value=JSESSIONID,
			port=None, 
			port_specified=False,
			domain="www.bkstr.com", 
			domain_specified=True, 
			domain_initial_dot=False,
			path="/",
			path_specified=True,
			secure=False,
			expires=None,
			discard=False,
			comment=None,
			comment_url=None,
			rest=None
		)

		self.cookies.set_cookie(cookie)

	def get_http(self, url, payload=''):
		response = None
		while response is None:
			try:
				response = self.session.get(
					url,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = True
				)

				print 'GET', response.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return response

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
					verify = False,
				)

				print 'POST', post.url

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return post

def main():
	tp = GWTextbooks()
	tp.direct()

if __name__ == "__main__":
	main()