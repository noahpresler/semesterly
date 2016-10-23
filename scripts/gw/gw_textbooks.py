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
		# self.headers['Referer'] = 'http://www.bkstr.com/webapp/wcs/stores/servlet/LocateCourseMaterialsView?storeId=10370'
		# self.headers['X-Prototype-Version']='1.5.0'
		# self.headers['X-Requested-With']='XMLHttpRequest'
		# self.headers['Host']='www.bkstr.com'

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

				print term

				depts = json.loads(re.search(r'\'(.*)\'', self.get_html(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]
				for dept in depts:
					query['departmentName'] = dept
					query['requestType'] = 'COURSES'

					print dept

					courses = json.loads(re.search(r'\'(.*)\'', self.get_html(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]
					for course in courses:
						query['courseName'] = course
						query['requestType'] = 'SECTIONS'

						print course

						sections = json.loads(re.search(r'\'(.*)\'', self.get_html(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]
						for section in sections:

							print section
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

							print self.get_html(self.url + '/CourseMaterialsResultsView', query2).text

	def get_jsessionid(self):

		JSESSIONID = re.search(r'JSESSIONID=(.*?);', self.get_html('http://www.bkstr.com/').text).group(1)
		print JSESSIONID
		# self.cookies['JSESSIONID'] = JSESSIONID
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
		# cookie = cookielib.Cookie(None, 'JSESSIONID', JSESSIONID, '80', '80', 'www.bkstr.com', None, None, '/', None, False, False, None, None, None, None)
		self.cookies.set_cookie(cookie)

		print self.get_html('http://www.bkstr.com/webapp/wcs/stores/servlet/LocateCourseMaterialsServlet?requestType=SECTIONS&storeId=10370&demoKey=d&programId=270&termId=100041961&divisionName=%20&departmentName=ACA&courseName=6209&_=').text

	# REQUESTS
	def get_html(self, url, payload=''):
		response = None
		while response is None:
			try:
				response = self.session.get(
					url,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					# verify = True
				)

				print 'GET', response.url

				# if r.status_code == 200:
					# response = r.text

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return response

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

def main():
	tp = GWTextbooks()
	tp.direct()

if __name__ == "__main__":
	main()