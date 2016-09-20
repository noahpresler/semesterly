# @what	Vanderbilt Eval Parser
# @org	Semeseter.ly
# @author	Michael N. Miller
# @updated	9/19/16

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
					verify = True
				)

				if r.status_code == 200:
					html = r.text

				# print 'GET: ' + r.url

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

			if r.status_code == 200:
				html = r.text

			# print "POST: " + r.url

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
			'VSASM_user': 'khanaf',
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
			'ViewSchool'	: school,
			'ViewArea'		: area,
			'ViewCourse'	: course
		}

		# Soupify post response
		soup = BeautifulSoup(
			self.post_http(self.base_url, select),
			'html.parser'
		)

		# Course review overview table
		overview_table = soup.find_all('table')

		# Make sure that table exists on page
		if len(overview_table) > 3:

			# Fun way to extract Score link
			for row in overview_table[3].find_all('tr'):

				cells = row.find_all('td')

				# Parse scores if available
				link = cells[len(cells) - 1].find('a')
				
				if link:

					# Parse single evaluations score page
					url = link['href'].replace('&amp;', '&')
					self.parse_eval_score_page(url)

	def parse_eval_score_page(self, url):

		# Soupify single course eval page
		html = BeautifulSoup(
			self.get_html(url),
			'html.parser'
		)

		body = html.find('table').find('body')

		# Review title
		title = body.find('title').text

		print '----------------------'
		print title.encode('utf-8')

		# List of all questions in review
		questions = body.find('table').find('table').find_all('td', {'valign' : 'top', 'width' : '200'})

		# Iterate through questions
		for question in questions:

			# extract table of results for question
			table = question.find_next('table')

			search_tags = {
				'align' : 'right',
				'nowrap' : '',
				'rowspan' : '20',
				'valign' : 'center',
				'width' : '250'
			}

			# Adjectives to describe scores
			adjs = table.find_all('td', search_tags)

			search_tags.clear()

			search_tags = {
				'align' : 'right',
				'rowspan' : '20',
				'style' : 'font-size:75%',
				'valign' : 'center',
				'width' : '24'
			}

			print 'Q: ' + question.text.strip()

			# Iterate over adjectives
			for adj in adjs:

				# Label (adjective) to describe numeric score
				label = adj.contents[0].strip()

				# Numeric score
				score = adj.find_next('td', search_tags).text.strip()

				print label.encode('utf-8') + ':' + score.encode('utf-8')

			print ""

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

	def make_review_item(self, code, prof, score, summary, year):
	 	courses = Course.objects.filter(code__contains = self.get_code_partial(code), school = "jhu")
	 	if len(courses) == 0:
	 		return
	 	else:
	 		course = courses[0]
	 		obj, created = Evaluation.objects.get_or_create(
	 			course=course,
	 			score=score,
	 			summary=summary,
	 			course_code=code[:20],
	 			professor=prof,
	 			year=year)
	 		if created:
	 			print "Evaluation Object CREATED for: " + code[:20]
	 		else:
	 			print "Evaluation Object FOUND for: " + code[:20]
		return

def main():
	vep = VandyEvalParser()
	vep.parse()

if __name__ == "__main__":
	main()