# @what	Vanderbilt Eval Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @date	9/13/16

import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys

class VandyEvalParser:

	def __init__(self, sem="Fall 2016"):
		self.session = requests.Session()
		self.headers = {'User-Agent' : 'My User Agent 1.0'}
		self.cookies = cookielib.CookieJar()
		self.school = 'vandy'
		self.semester = sem
		self.departments = {}
		self.course = {}
		self.base_url = 'https://www.sds.vanderbilt.edu/perl/voiceview.pl'

	def get_html(self, url, payload=''):
		html = None
		while html is None:
			try:
				r = self.session.get(
					url,
					params = payload,
					cookies = self.cookies,
					headers = self.headers,
					verify = True)

				# print 'GET: ' + r.url

				if r.status_code == 200:
					html = r.text

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				print "Unexpected error: ", sys.exc_info()[0]
				continue

		return html.encode('utf-8')

	def post_http(self, url, form, payload = ''):
		
		html = ''

		try:

			r = self.session.post(
				url,
				data = form,
				params = payload,
				cookies = self.cookies,
				headers = self.headers,
				verify = True
			)

			# print "POST: " + r.url

			if r.status_code == 200:
				html = r.text

		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + sys.exc_info()[0])

		return html

	def login(self):
		
		# Login Page
		soup = BeautifulSoup(
			self.get_html(self.base_url), 
			'html.parser'
		)

		# FIXME -- security checkpoints might not all be necessary
		# Security checkpoint
		vsasm_asv_block = soup.find('input', {'name': 'VSASM_ASVBlock'})['value']

		form = {
			'VSASM_ASVBlock': vsasm_asv_block,
			'VSASM_user': '***REMOVED***',
			'VSASM_pw': 'Gainz!23',
			'VSASM_Login': 'Login'
		}

		# Accept Terms and Conditions page
		soup = BeautifulSoup(
			self.post_http(self.base_url, form),
			'html.parser'
		)

		# Security checkpoint
		vsasm_block = soup.find('input', {'name': 'VSASM_BLOCK'})['value']

		form = {
			'VSASM_BLOCK': vsasm_block,
			'VoiceViewUserType': 'ActiveStudent',
			'TermsAccepted': 'OK'
		}

		# Search page
		soup = BeautifulSoup(
			self.post_http(self.base_url, form),
			'html.parser'
		)

	def parse(self):

		self.login()

		for school in self.parse_list_of_schools():

			for area in self.parse_list_of_areas(school):

				for course in self.parse_list_of_courses(school, area):

					print '--------------------------------------'
					print area, course
					self.parse_eval_results(school, area, course)

	def parse_eval_results(self, school, area, course):
		
		# Search selection criteria
		select = {
			'ViewSchool' : school,
			'ViewArea' : area,
			'ViewCourse' : course
		}

		# Soupify post response
		soup = BeautifulSoup(
			self.post_http(self.base_url, select),
			'html.parser'
		)

		# Fun way to extract Score link
		for row in soup.find_all('table')[3].find_all('tr'):

			cells = row.find_all('td')

			link = cells[len(cells) - 1].find('a')
			if link:
				self.parse_eval_score_page(link['href'].replace('&amp;', '&'))

	def parse_eval_score_page(self, url):

		print url

		html = BeautifulSoup(
			self.get_html(url),
			'html.parser'
		)

		# rows = html.find('table').find_all('table')[1].find_all('tr', recursive = False)

		# title = rows[0].text.strip()
		# more_info = rows[1].find('td').text.splitlines()[0]
		# print title
		# print more_info

		rows = html.find('table').find_all('table')[1].find('table')

		print len(rows)

		for row in rows[2:]:

			cells = row.find_all('td')

			question = cells[2].text
			print question

			details = cells[3].find_all('td', {'rowspan' : '20'})
			
			for descriptor, value in zip(details[0::2], details[1::2]):
				print re.match(r'(.*)\d', descriptor.text).group(1).strip() + ':' + value.text

		exit()

	def parse_list_of_courses(self, school, area):

		# Search selection criteria
		select = {
			'ViewSchool' : school,
			'ViewArea' : area
		}

		# Soupify post response
		soup = BeautifulSoup(
			self.post_http(self.base_url, select),
			'html.parser'
		)

		# Extract courses from html
		courses = soup.find('select', {'name' : 'ViewCourse'}).find_all('option')

		# Return list of courses within school and area
		return [c['value'].strip() for c in courses if c['value'].strip()]		

	def parse_list_of_areas(self, school):

		# Search selection criteria
		select = {
			'ViewSchool' : school
		}

		# Soupify post response
		soup = BeautifulSoup(
			self.post_http(self.base_url, select),
			'html.parser'
		)

		# Extract area list from html
		areas = soup.find('select', {'name' : 'ViewArea'}).find_all('option')

		# Return list of school codes
		return [a['value'] for a in areas if a['value']]		

	def parse_list_of_schools(self):

		# Soupify post response
		soup = BeautifulSoup(
			self.get_html(self.base_url),
			'html.parser'
		)

		# Extract school list from html
		schools = soup.find('select', {'name' : 'ViewSchool'}).find_all('option')

		# Return list of school codes
		return [s['value'] for s in schools if s['value']]

def main():
	vep = VandyEvalParser()
	vep.parse()

if __name__ == "__main__":
	main()