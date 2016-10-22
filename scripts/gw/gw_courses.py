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
from itertools import izip

class GWParser:

	def __init__(self):
		self.session = requests.Session()
		self.headers = {'User-Agent' : UserAgent().chrome}
		self.cookies = cookielib.CookieJar()
		self.school = 'gw'
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

				# print 'GET', r.url

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
		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_WWWLogin')

		credentials = {
			'sid' : self.username,
			'PIN' : self.password
		}

		self.headers['Referer'] = self.url + '/PRODCartridge/twbkwbis.P_WWWLogin'

		if self.post_http(self.url + '/PRODCartridge/twbkwbis.P_ValLogin', credentials).status_code != 200:
			sys.stderr.write('Unexpected error: login unsuccessful - ' + str(sys.exc_info()[0]) + '\n')
			exit(1)

	def direct_to_search_page(self):
		query = {}
		query['name'] = 'bmenu.P_MainMnu'
		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_GenMenu', query)
		query['name'] = 'bmenu.P_StuMainMnu'
		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_GenMenu', query)
		query['name'] = 'bmenu.P_RegMnu'
		self.get_html(self.url + '/PRODCartridge/twbkwbis.P_GenMenu', query)
		query.clear()
		query['term_in'] = ''
		return self.get_html(self.url + '/PRODCartridge/bwskfcls.P_CrseSearch', query)

	def parse(self):
		self.login()
		self.direct_to_search_page()

		# NOTE: hardcoded terms to parse
		terms = {'F':'201603', 'S':'201701'}
		for term in terms:

			search_query = {
				'p_calling_proc' : 'P_CrseSearch',
				'p_term' : terms[term]
			}

			soup = BeautifulSoup(self.post_http(self.url + '/PRODCartridge/bwckgens.p_proc_term_date', search_query).text, 'html.parser')

			# create search param list
			self.headers['Referer'] = self.url + '/bwckgens.p_proc_term_date'
			search_params = {inp['name'] : inp['value'] if inp.get('value') else '' for inp in soup.find('form', {'action': '/PRODCartridge/bwskfcls.P_GetCrse'}).find_all('input')}
			search_params['begin_hh'] = '0'
			search_params['begin_mi'] = '0'
			search_params['end_hh'] = '0'
			search_params['end_mi'] = '0'
			search_params['sel_ptrm']  = '%'
			search_params['SUB_BTN'] = 'Section Search'
		
			# get list of departments
			depts = (dept['value'] for dept in soup.find('select', {'id' : 'subj_id'}).find_all('option'))

			for dept in depts:

				search_params['sel_subj'] = ['dummy', dept]

				rows = BeautifulSoup(self.post_http(self.url + '/PRODCartridge/bwskfcls.P_GetCrse', search_params).text, 'html.parser').find('table', {'class':'datadisplaytable'}).find_all('tr')[2:]

				courses = {}

				for row in rows:
					info = row.find_all('td')
					ident = info[1].text
					code = info[2].text + ' ' + info[3].text
					courses[code] = {
						'ident':	info[1].text,
						'href':		info[1].find('a')['href'],
						'dept': 	info[2].text,
						'code': 	info[2].text + ' ' + info[3].text,
						'section': 	info[4].text,
						'credits': 	float(info[6].text) if GWParser.is_float(info[6].text) else 0.0,
						'title':	info[7].text,
						'days':		info[8].text,
						'capacity':	info[10].text,
						'enrlment':	info[11].text,
						'instr':	info[19].text,
						'loc':		info[20].text,
						'attr':		info[21].text
					}
					print 'CODE', code

				details_query = {
					'term_in':terms[term],
					'one_subj':dept,
					# 'sel_crse_strt':rows[1].find_all('td')[1].text,
					# 'sel_crse_end':rows[-1].find_all('td')[1].text,
					'sel_subj':'',
					'sel_levl':'',
					'sel_schd':'',
					'sel_coll':'',
					'sel_divs':'',
					'sel_dept':dept,
					'sel_attr':''
				}
				soup = BeautifulSoup(self.get_html(self.url + '/PRODCartridge/bwckctlg.p_display_courses', details_query))
				# print soup.prettify().encode('utf-8')
				rows1 = soup.find('body').find('table', {'class':'datadisplaytable'}).find_all('tr', recursive=False)
				# print rows1.prettify()
				for title, descr in izip(rows1[::2], rows1[1:][::2]):
					title = [l for l in title.text.splitlines() if l.strip()][0]
					code = re.match(r'(.*) - .*', title).group(1).encode('utf-8')
					print code
					if courses.get(code):
						# print courses[code]

						descr = re.match(r'<td .*?>\n([^<]+)<[^$]*</td>', descr.find('td').prettify())
						
						# extract description (if it exists)
						if descr:
							descr = descr.group(1).strip()
							print descr
						else:
							print 'NO DESCRIPTION'

						# for l in descr.text.splitlines():
							# if l.strip():
								# pass
								# print l.strip()

					# print descr.find('td', {'class':'ntdefault'}).prettify()
				# descrs = soup.find_all('td', {'class':'ntdefault'})
				# for descr in descrs:
					# print descr.text.encode('utf-8')
				# print '\n\n'

				continue

				for course in courses.values():


					
					soup = BeautifulSoup(self.get_html(self.url + course['href'])).find('th', {'class':'ddtitle'})
					title = soup.text
					print title
					# extract info from title
					title = re.match(r'(.*) - (\d*) - (.*) - (\d*)', title)
					print title.group(1)
					print title.group(2)
					print title.group(3)
					print title.group(4)



					details_query = {
						'term_in':terms[term],
						'one_subj':dept,
						# 'sel_crse_strt':course['code'],
						# 'sel_crse_end':course['code'],
						'sel_subj':dept,
						'sel_levl':'',
						'sel_schd':'',
						'sel_coll':'',
						'sel_divs':'',
						'sel_dept':'',
						'sel_attr':''
					}
					soup = BeautifulSoup(self.get_html(self.url + '/PRODCartridge/bwckctlg.p_display_courses', details_query))
					print soup.prettify()
					# exit(1)

					# details_query = {
						# 'cat_term_in':  terms[term],
						# 'subj_code_in': dept,
						# 'crse_numb_in': course['ident']
					# }
					# soup = BeautifulSoup(self.get_html(self.url + soup.find('a')['href']), 'html.parser').find('table', {'class':'datadisplaytable'})
					# print soup.text

					# soup = BeautifulSoup(self.get_html(self.url + '/PRODCartridge/bwckctlg.p_disp_course_detail', details_query), 'html.parser')#.find('table', {'class':'datadisplaytable'})#.find('td', {'class':'ntdefualt'})
					# print soup.prettify()
					# print '\n\n'

			# break

	@staticmethod
	def is_float(subject):
		try:
			float(subject)
			return True
		except ValueError:
			return False

def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main()