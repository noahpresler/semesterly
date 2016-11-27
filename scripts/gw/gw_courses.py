# @what GW Course Parser
# @org  Semeseter.ly
# @author   Michael N. Miller
# @date 11/26/16

import re, sys

import django, os, datetime, re, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
# from fake_useragent import UserAgent
# from bs4 import BeautifulSoup
# import requests, cookielib, re, sys
from itertools import izip

# parser library
from scripts.textbooks.amazon import make_textbook
from scripts.parser_library.Requester import Requester
from scripts.parser_library.Extractor import *
from scripts.parser_library.Model import Model
from scripts.parser_library.Misc import *

class GWParser:

	def __init__(self):
		self.school = 'gw'
		self.username = 'G45956511'
		self.password = '052698'
		self.url = 'https://banweb.gwu.edu'
		self.course = Model(self.school)
		self.requester = Requester()

	def login(self):
		print 'Logging in...'

		# Collect necessary cookies
		self.requester.get(self.url + '/PRODCartridge/twbkwbis.P_WWWLogin')

		credentials = {
			'sid' : self.username,
			'PIN' : self.password
		}

		self.requester.headers['Referer'] = self.url + '/PRODCartridge/twbkwbis.P_WWWLogin'

		if self.requester.post(self.url + '/PRODCartridge/twbkwbis.P_ValLogin', form=credentials, parse=False).status_code != 200:
			sys.stderr.write('Unexpected error: login unsuccessful - ' + str(sys.exc_info()[0]) + '\n')
			exit(1)

	def direct_to_search_page(self):
		genurl = self.url + '/PRODCartridge/twbkwbis.P_GenMenu'
		actions = ['bmenu.P_MainMnu', 'bmenu.P_StuMainMnu', 'bmenu.P_RegMnu']
		map(lambda n: self.requester.get(genurl, params={'name':n}), actions)
		return self.requester.get(self.url + '/PRODCartridge/bwskfcls.P_CrseSearch', params={'term_in':''})

	def parse(self):
		self.login()
		self.direct_to_search_page()

		# NOTE: hardcoded terms to parse
		# terms = {'Fall 2016':'201603', 'Spring 2017':'201701'}
		terms = {'Spring 2017':'201701'}
		for term_name, term_code in terms.items():

			print 'Parsing courses for term', term_name
	
			self.semester = term_code

			search_query = {
				'p_calling_proc' : 'P_CrseSearch',
				'p_term' : term_code
			}

			soup = self.requester.get(self.url + '/PRODCartridge/bwckgens.p_proc_term_date', params=search_query)
			self.requester.headers['Referer'] = self.url + '/bwckgens.p_proc_term_date'

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

				print '\tParsing courses in department', dept

				search_params['sel_subj'] = ['dummy', dept]

				rows = self.requester.post(self.url + '/PRODCartridge/bwskfcls.P_GetCrse', params=search_params).find('table', {'class':'datadisplaytable'})
				if rows:
					rows = rows.find_all('tr')[2:]
				else:
					continue

				courses = {}

				# collect offered courses in department
				for row in rows:
					info = row.find_all('td')
					if info[1].find('a'):

						print '\t\t', info[2].text, info[3].text

						# general info
						self.course = {
							'ident':	info[1].text,
							'code':		info[2].text + ' ' + info[3].text,
							'href':		info[1].find('a')['href'],
							'dept': 	dept,
							'selec': 	info[3].text,
							'section': 	info[4].text,
							'credits': 	float(info[6].text) if isfloat(info[6].text) else 0.0,
							'title':	info[7].text,
							'capacity':	info[10].text,
							'enrlment':	info[11].text,
							'attr':		'; '.join(info[22].text.split(' and ')) if len(info) == 23 else '' #FIXME - hacky fix
						}

						# query course catalog to obtain description
						catalog_query = {
							'term_in':term_code,
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

						catalog = self.requester.get(self.url + '/PRODCartridge/bwckctlg.p_display_courses', params=catalog_query)
						if catalog:
							self.course['descr'] = GWParser.extract_description(catalog)

						section_query = {
							'term_in':term_code,
							'subj_in':self.course['dept'],
							'crse_in':self.course['selec'],
							'crn_in':self.course['ident']
						}

						section = self.requester.get(self.url + '/PRODCartridge/bwckschd.p_disp_listcrse', params=section_query)

						# parse scheduling info
						meeting_times = GWParser.extract_meeting_times(section)

						# self.print_course()
						course = self.create_course()

						# collect instr info
						self.course['instrs'] = ', '.join((mt.find_all('td')[6].text for mt in meeting_times))
						section = self.create_section(course)

						for mt in meeting_times:
							col = mt.find_all('td')
							time_range = re.match(r'(.*) - (.*)', col[1].text)
							if time_range:
								self.course['time_start'] = time_12to24(time_range.group(1))
								self.course['time_end'] = time_12to24(time_range.group(2))
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
			semester = self.semester[0],
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

def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main()
