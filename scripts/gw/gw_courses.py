# @what GW Course Parser
# @org  Semeseter.ly
# @author   Michael N. Miller
# @date 10/20/16

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
		self.headers = {'User-Agent' : 'User-Agent 1.0'}
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

				return post

			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				sys.stderr.write("Unexpected error: " + str(sys.exc_info()[0]))
				continue

		return p

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
		# terms = {'F':'201603', 'S':'201701'}
		terms = {'S':'201701'}
		for term in terms:

			print 'Parsing courses for term ', term
	
			self.semester = term

			search_query = {
				'p_calling_proc' : 'P_CrseSearch',
				'p_term' : terms[term]
			}

			soup = BeautifulSoup(self.post_http(self.url + '/PRODCartridge/bwckgens.p_proc_term_date', search_query).text, 'html.parser')
			self.headers['Referer'] = self.url + '/bwckgens.p_proc_term_date'

			# create search param list
			search_params = {inp['name'] : inp['value'] if inp.get('value') else '' for inp in soup.find('form', {'action': '/PRODCartridge/bwskfcls.P_GetCrse'}).find_all('input')}
			search_params.update({
				'begin_hh' : '0',
				'begin_mi' : '0',
				'end_hh'   : '0',
				'end_mi'   : '0',
				'sel_ptrm' : '%',
				'SUB_BTN'  : 'Section Search'
			})

			# get list of departments
			depts = [dept['value'] for dept in soup.find('select', {'id' : 'subj_id'}).find_all('option')]

			for dept in depts:

				print 'Parsing courses in department', dept

				search_params['sel_subj'] = ['dummy', dept]

				post = self.post_http(self.url + '/PRODCartridge/bwskfcls.P_GetCrse', search_params)
				url = post.url
				rows = BeautifulSoup(post.text, 'html.parser').find('table', {'class':'datadisplaytable'})
				if rows:
					rows = rows.find_all('tr')[2:]
				else:
					continue

				courses = {}

				# collect offered courses in department
				for row in rows:
					info = row.find_all('td')
					if info[1].find('a'):

						print '\t', info[2].text, info[3].text

						# general info
						self.course = {
							'ident':	info[1].text,
							'code':		info[2].text + ' ' + info[3].text,
							'href':		info[1].find('a')['href'],
							'dept': 	dept,
							'selec': 	info[3].text,
							'section': 	info[4].text,
							'credits': 	float(info[6].text) if GWParser.is_float(info[6].text) else 0.0,
							'title':	info[7].text,
							'capacity':	info[10].text,
							'enrlment':	info[11].text,
							'attr':		'; '.join(info[22].text.split(' and ')) if len(info) == 23 else '' #FIXME - hacky fix
						}

						# query course catalog to obtain description
						catalog_query = {
							'term_in':terms[term],
							'one_subj':self.course['dept'],
							'sel_crse_strt':self.course['selec'],
							'sel_crse_end':self.course['selec'],
							'sel_subj':'',
							'sel_levl':'',
							'sel_schd':'',
							'sel_coll':'',
							'sel_divs':'',
							'sel_dept':'',
							'sel_attr':''
						}

						catalog = self.get_html(self.url + '/PRODCartridge/bwckctlg.p_display_courses', catalog_query)
						if catalog:
							soup = BeautifulSoup(catalog, 'html.parser')
							self.course['descr'] = GWParser.extract_description(soup)

						section_query = {
							'term_in':terms[term],
							'subj_in':self.course['dept'],
							'crse_in':self.course['selec'],
							'crn_in':self.course['ident']
						}

						section = self.get_html(self.url + '/PRODCartridge/bwckschd.p_disp_listcrse', section_query)

						# parse scheduling info
						meeting_times = GWParser.extract_meeting_times(BeautifulSoup(section, 'html.parser'))

						# self.print_course()
						course = self.create_course()

						# collect instr info
						self.course['instrs'] = ', '.join((mt.find_all('td')[6].text for mt in meeting_times))
						section = self.create_section(course)

						for mt in meeting_times:
							col = mt.find_all('td')
							time_range = re.match(r'(.*) - (.*)', col[1].text)
							if time_range:
								self.course['time_start'] = GWParser.time_12to24(time_range.group(1))
								self.course['time_end'] = GWParser.time_12to24(time_range.group(2))
								self.course['days'] = list(col[2].text)
								self.course['loc'] = col[3].text
							else:
								continue
							meeting_type = col[5].text[0].upper()
							self.create_offerings(section)

		self.wrap_up()

	def print_course(self):
		for key in self.course:
			print key, ':', self.course[key]

	@staticmethod
	def extract_description(soup):
		soup = soup.find('body').find('table', {'class':'datadisplaytable'}).find_all('tr', recursive=False)[1].find('td')
		descr = re.match(r'<td .*?>\n([^<]+)<[^$]*</td>', soup.prettify())
		return ' '.join(descr.group(1).strip().splitlines()) if descr else ''

	def wrap_up(self):
			update_object, created = Updates.objects.update_or_create(
					school=self.school,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
			)
			update_object.save()

	def create_course(self):
		course_model, course_was_created = Course.objects.update_or_create(
			code = self.course['code'],
			school = self.school,
			campus = 1,
			defaults = {
				'name': self.course['title'],
				'description': self.course['descr'] if self.course.get('descr') else '',
				'areas': self.course['attr'],
				'prerequisites': '', # TODO
				'num_credits': self.course.get('credits'),
				'level': '0', # TODO
				'department': self.course.get('dept')
			}
		)

		return course_model

	def create_section(self, course_model):
		# TODO - deal with cancelled course
		section, section_was_created = Section.objects.update_or_create(
			course = course_model,
			semester = self.semester,
			meeting_section = self.course.get('section'),
			defaults = {
				'instructors': self.course.get('intrs') or '',
				'size': int(self.course.get('capacity')),
				'enrolment': int(self.course.get('enrlment'))
			}
		)

		return section

	def create_offerings(self, section_model):
		if self.course.get('days'):
			for day in self.course.get('days'):
				offering_model, offering_was_created = Offering.objects.update_or_create(
					section = section_model,
					day = day,
					time_start = self.course.get('time_start'),
					time_end = self.course.get('time_end'),
					defaults = {
						'location': self.course.get('loc')
					}
				)

	@staticmethod
	def time_12to24(time12):

		# Regex extract
		match = re.match("(\d*):(\d*).*?(\S)", time12)

		# Transform to 24 hours
		hours = int(match.group(1))
		if re.search(r'[pP]', match.group(3)):
			hours = (hours%12)+12

		# Return as 24hr-time string
		return str(hours) + ":" + match.group(2)

	@staticmethod
	def extract_meeting_times(soup):
		# print soup.prettify().encode('utf-8')
		meeting_times = soup.find('table', {'class':'datadisplaytable'})
		if meeting_times:
			meeting_times = meeting_times.find('table', {'class':'datadisplaytable'})
			if meeting_times:
				meeting_times = meeting_times.find_all('tr')[1:]
			else:
				meeting_times = []
		else:
			meeting_times = []

		return meeting_times

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
