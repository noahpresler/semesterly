import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys
from itertools import izip
import json
from scripts.textbooks.amazon import make_textbook

class GWTextbooks:

	def __init__(self):
		self.session = requests.Session()
		self.headers = {'User-Agent' : UserAgent().random}
		self.cookies = cookielib.CookieJar()
		self.url = 'http://www.bkstr.com/webapp/wcs/stores/servlet'
		self.store_id = '10370'
		self.school = 'gw'

	def direct(self):

		print 'Parsing Textbooks for ' + ''.join(map(lambda x: x.upper(), self.school))

		self.get_jsessionid()

		query = {
			'storeId':self.store_id,
			'demoKey':'d',
			'requestType':'INITIAL',
			'_': ''
		}

		programs = self.extract_json(query)
		for program in programs:
	
			print 'in Program: ' + program

			query['programId'] = programs[program]
			query['requestType'] = 'TERMS'

			terms = self.extract_json(query)
			for term in terms:

				print 'in Term: ' + term

				query['termId'] = terms[term]
				query['requestType'] = 'DEPARTMENTS'

				depts = self.extract_json(query)
				for dept in depts:

					print '\tin Dept: ' + dept

					query['departmentName'] = depts[dept]
					query['requestType'] = 'COURSES'

					courses = self.extract_json(query)
					for course in courses:

						print '\t\tcourse: ' + course

						query['courseName'] = courses[course]
						query['requestType'] = 'SECTIONS'

						sections = self.extract_json(query)
						for section in sections:

							print '\t\t\tsection: ' + section

							query2 = {
								'categoryId':'9604',
								'storeId':self.store_id,
								'langId':'-1',
								'programId':programs[program],
								'termId':terms[term],
								'divisionDisplayName':' ',
								'departmentDisplayName':depts[dept],
								'courseDisplayName':courses[course],
								'sectionDisplayName':sections[section],
								'demoKey':'d',
								'purpose':'browse'
							}

							soup = BeautifulSoup(self.get_http(self.url + '/CourseMaterialsResultsView', query2).text, 'html.parser')

							course_model = self.retrieve_course(depts[dept] + ' ' + courses[course])
							if not course_model :
								continue
							section_models = Section.objects.filter(course = course_model, meeting_section = sections[section])

							if not soup.find('div', id='efCourseErrorSection'):
								materials = soup.find_all('li', {'class':'material-group'})
								for material in materials:
									
									required = re.match('material-group_(.*)', material['id']).group(1) == 'REQUIRED'
									
									books = material.find_all('ul')

									for book in books:
										isbn = book.find('span', id='materialISBN')
										isbn.find('strong').extract()
										isbn = isbn.text.strip()

										for section_model in section_models:
											make_textbook(required, isbn, section_model)

	def extract_json(self, query):
		return json.loads(re.search(r'\'(.*)\'', self.get_http(self.url + '/LocateCourseMaterialsServlet', query).text).group(1))['data'][0]

	def retrieve_course(self, course_code):
		try:
			return Course.objects.filter(code__contains = course_code, school = self.school)[0]
		except IndexError:
			sys.stderr.write('NOTE: course ' + course_code + ' does not exist in database\n')
			return None

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

				# print 'GET', response.url

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

				# print 'POST', post.url

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