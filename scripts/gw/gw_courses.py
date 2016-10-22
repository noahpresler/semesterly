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
		self.session = requests.Session()
		self.headers = {'User-Agent' : UserAgent().chrome}
		self.cookies = cookielib.CookieJar()
		self.school = 'gw'
		self.username = 'G45956511'
		self.password = '052698'
		self.url = 'https://banweb.gwu.edu/PRODCartridge'
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

	def post_http(self, url, form, payload=''):

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

			return post
		except (requests.exceptions.Timeout,
			requests.exceptions.ConnectionError):
			sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))

		return None

	def login(self):
		print "Logging in..."

		# Collect necessary cookies
		self.get_html(self.url + '/twbkwbis.P_WWWLogin')

		credentials = {
			'sid' : self.username,
			'PIN' : self.password
		}

		self.headers['Referer'] = 'https://banweb.gwu.edu/PRODCartridge/twbkwbis.P_WWWLogin'

		if self.post_http(self.url + '/twbkwbis.P_ValLogin', credentials).status_code != 200:
			sys.stderr.write('Unexpected error: login unsuccessful - ' + str(sys.exc_info()[0]) + '\n')
			exit(1)

	def direct_to_search_page(self):
		query = {}
		query['name'] = 'bmenu.P_MainMnu'
		self.get_html(self.url + '/twbkwbis.P_GenMenu', query)
		query['name'] = 'bmenu.P_StuMainMnu'
		self.get_html(self.url + '/twbkwbis.P_GenMenu', query)
		query['name'] = 'bmenu.P_RegMnu'
		self.get_html(self.url + '/twbkwbis.P_GenMenu', query)
		query.clear()
		query['term_in'] = ''
		return self.get_html(self.url + '/bwskfcls.P_CrseSearch', query)

	def parse(self):
		self.login()
		self.direct_to_search_page()

		# NOTE: hardcoded semesters to parse
		semesters = {'F':'201603', 'S':'201701'}
		for semester in semesters:

			search_query = {
				'p_calling_proc' : 'P_CrseSearch',
				'p_term' : semesters[semester]
			}

			soup = BeautifulSoup(self.post_http(self.url + '/bwckgens.p_proc_term_date', search_query).text, 'html.parser')

			# create search param list
			search_params = {inp['name'] : inp['value'] if inp.get('value') else '' for inp in soup.find('form', {'action': '/PRODCartridge/bwskfcls.P_GetCrse'}).find_all('input')}

			# get list of departments
			depts = (dept['value'] for dept in soup.find('select', {'id' : 'subj_id'}).find_all('option'))

			for dept in depts:

				self.headers['Referer'] = self.url + '/bwckgens.p_proc_term_date'

				search_params['sel_subj'] = ['dummy', dept]
				search_params['SUB_BTN'] = 'Course Search'
				search_params['begin_hh'] = '0'
				search_params['begin_mi'] = '0'
				search_params['end_hh'] = '0'
				search_params['end_mi'] = '0'
				search_params['sel_ptrm']  = '%'

				# html = requests.post('https://banweb.gwu.edu/PRODCartridge/bwskfcls.P_GetCrse', headers=headers, cookies=self.cookies, data=data).text
				# print BeautifulSoup(html, 'html.parser').prettify()
				# exit(0)

				for param in search_params:
					print param + ':' + str(search_params[param])
				html = self.post_http(self.url + '/bwskfcls.P_GetCrse', search_params).text
				print html
				# print BeautifulSoup(html, 'html.parser').prettify()

				break

			break


def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main()