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
		self.headers = {'User-Agent' : UserAgent().random}
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

				print 'GET', r.url

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

				print 'POST', post.url

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
		terms = {'F':'201603', 'S':'201701'}
		for term in terms:

			print term

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

				# collect offered courses in department
				for row in rows:
					info = row.find_all('td')
					if info[1].find('a'):
						code = info[2].text + ' ' + info[3].text
						courses[code] = {
							'code':		code,
							'href':		info[1].find('a')['href'],
							'dept': 	info[2].text,
							'code': 	info[2].text + ' ' + info[3].text,
							'section': 	info[4].text,
							'credits': 	float(info[6].text) if GWParser.is_float(info[6].text) else 0.0,
							'title':	info[7].text,
							'capacity':	info[10].text,
							'enrlment':	info[11].text,
							# 'attr':		';'.join(info[22].text.split(' and '))
						}
						print code

				# match course descriptions to offered courses
				details_query = {
					'term_in':terms[term],
					'one_subj':dept,
					'sel_dept':dept,
					'sel_subj':'',
					'sel_levl':'',
					'sel_schd':'',
					'sel_coll':'',
					'sel_divs':'',
					'sel_attr':''
				}
				print details_query
				soup = BeautifulSoup(self.get_html(self.url + '/PRODCartridge/bwckctlg.p_display_courses', details_query), 'html.parser')
				rows1 = soup.find('body').find('table', {'class':'datadisplaytable'}).find_all('tr', recursive=False)
				for title, descr in izip(rows1[::2], rows1[1:][::2]):

					title = [l for l in title.text.splitlines() if l.strip()][0]
					code = re.match(r'(.*) - .*', title).group(1)

					print 'CODE', code
					# extract description (if it exists)
					if courses.get(code) is not None:
						print descr.text
						print descr.find('td')
						descr = re.match(r'<td .*?>\n([^<]+)<[^$]*</td>', descr.find('td').prettify())
						courses[code]['descr'] = ' '.join(descr.group(1).strip().splitlines()) if descr else ''

				for code in courses:

					soup = BeautifulSoup(self.get_html(self.url + courses[code]['href']))
					title = soup.find('th', {'class':'ddtitle'}).text
					print title
					# extract info from title
					title = re.match(r'(.*) - (\d*) - (.*) - (\d*)', title)

					# sanity check
					if code != title.group(3):
						exit(1)

					# parse meeting times
					meeting_times = GWParser.extract_meeting_times(soup)

					for mt in meeting_times:
						info = mt.find_all('td')
						time_range = re.match(r'(.*) - (.*)', info[1].text)
						if time_range:
							time_start = GWParser.time_12to24(time_range.group(1))
							time_end = GWParser.time_12to24(time_range.group(2))
						else:
							continue
						days = list(info[2].text)
						loc = info[3].text
						mtype = info[5].text[0].upper()
						instrs = info[6].text

					# exit(0)

					# soup_wl = BeautifulSoup(self.get_html(self.url + soup.find('a')['href']), 'html.parser').find('table', {'class':'datadisplaytable'})/
					# print soup_wl.prettify()
					# print '\n\n'

	def wrap_up(self):
			update_object, created = Updates.objects.update_or_create(
					school=self.school,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
			)
			update_object.save()

	def create_course(self, course):
		course_model, course_was_created = Course.objects.update_or_create(
			code = course['code'],
			school = self.school,
			campus = 1,
			defaults = {
				'name': course['name'],
				'description': course['descr'] if course.get('descr') else '',
				'areas': 'TODO NOPE',
				'prerequisites': 'TODO NOT YET',
				'num_credits': float(course.get('credits')),
				'level': '0',
				'department': course.get('dept')
			}
		)

		return course_model

	def create_section(self, course_model):
		if self.course.get('cancelled'):

			if Section.objects.filter(course = course_model, meeting_section = self.course.get('section')).exists():
				s = Section.objects.get(course = course_model, meeting_section = self.course.get('section'))
				Offering.objects.filter(section = s).delete()
				s.delete()

			self.course['cancelled'] = False

			return None

		else:
			section, section_was_created = Section.objects.update_or_create(
				course = course_model,
				semester = self.semester,
				meeting_section = self.course.get('section'),
				defaults = {
					'instructors': self.course.get('Instructor(s)') or '',
					'size': int(self.course.get('Class Capacity')),
					'enrolment': int(self.course.get('Total Enrolled'))
				}
			)

			return section

	def create_offerings(self, section_model):
		if self.course.get('days'):
			for day in list(self.course.get('days')):
				offering_model, offering_was_created = Offering.objects.update_or_create(
					section = section_model,
					day = day,
					time_start = self.course.get('time_start'),
					time_end = self.course.get('time_end'),
					defaults = {
						'location': self.course.get('Location')
					}
				)

	@staticmethod
	def time_12to24(time12):

		# Regex extract
		match = re.match("(\d*):(\d*).*(\S)", time12)

		# Transform to 24 hours
		hours = int(match.group(1))
		if re.search(r'[pP]', match.group(3)):
			hours = (hours%12)+12

		# Return as 24hr-time string
		return str(hours) + ":" + match.group(2)

	@staticmethod
	def extract_meeting_times(soup):
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