# @what GW Course Parser
# @org  Semeseter.ly
# @author   Michael N. Miller
# @date 11/26/16

import re, sys
from bs4 import BeautifulSoup, NavigableString, Tag
from django.utils.encoding import smart_str, smart_unicode

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
		self.terms = {
			'Fall 2016':'201603', 
			'Spring 2017':'201701'
		}

	def login(self):
		print 'Logging in...'

		# Collect necessary cookies
		self.requester.get(self.url + '/PRODCartridge/twbkwbis.P_WWWLogin', parse=False)

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
		return self.requester.get(self.url + '/PRODCartridge/bwskfcls.P_CrseSearch', params={'term_in':''}, parse=False)

	def parse(self):
		self.login()
		self.direct_to_search_page()

		for term_name, term_code in self.terms.items():

			print '> Parsing courses for term', term_name

			self.course['term'] = term_name[0]

			query1 = {
				'p_calling_proc' : 'P_CrseSearch',
				'p_term' : term_code
			}

			soup = self.requester.get(self.url + '/PRODCartridge/bwckgens.p_proc_term_date', params=query1)
			self.requester.headers['Referer'] = self.url + '/bwckgens.p_proc_term_date'

			# create search param list
			query2 = {a['name'] : a['value'] if a.get('value') else '' for a in soup.find('form', {'action': '/PRODCartridge/bwskfcls.P_GetCrse'}).find_all('input')}
			query2.update({
				'begin_hh' : '0',
				'begin_mi' : '0',
				'end_hh'   : '0',
				'end_mi'   : '0',
				'sel_ptrm' : '%',
				'SUB_BTN'  : 'Section Search'
			})

			# get list of departments
			depts = {dept.text.strip(): dept['value'] for dept in soup.find('select', {'id' : 'subj_id'}).find_all('option')}

			for dept_name, dept_code in depts.iteritems():
				print '>> Parsing courses in department', dept_name

				query2['sel_subj'] = ['dummy', dept_code]

				rows = self.requester.post(self.url + '/PRODCartridge/bwskfcls.P_GetCrse', params=query2)

				if GWParser.iserrorpage(rows):
					exit(1)

				try:
					rows = rows.find('table', {'class':'datadisplaytable'}).find_all('tr')[2:]
				except AttributeError:
					print '\tmessage: no results for department', dept_name
					continue # no results for department

				# collect offered courses in department
				for row in rows:
					info = row.find_all('td')
					if info[1].find('a'):

						print '\t', info[2].text, info[3].text, info[4].text

						# general info
						self.course.update({
							'ident':	info[1].text,
							'code':		info[2].text + ' ' + info[3].text,
							'href':		info[1].find('a')['href'],
							'dept': 	dept_name,
							'selec': 	info[3].text,
							'section': 	info[4].text,
							'credits': 	safe_cast(info[6].text, float, default=0.0),
							'name':		info[7].text,
							'size':		info[10].text,
							'enrolment':	info[11].text,
							'waitlist':	safe_cast(info[14].text, int, default=-1),
							'attr':		'; '.join(info[22].text.split(' and ')) if len(info) == 23 else '' #FIXME - hacky fix
						})

						# query course catalog to obtain description
						query3 = {
							'term_in':term_code,
							'one_subj':dept_code,
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

						catalog = self.requester.get(self.url + '/PRODCartridge/bwckctlg.p_display_courses', params=query3)
						if catalog:
							self.course.update(self.parse_catalogentrypage(catalog))

						query4 = {
							'term_in':term_code,
							'subj_in':dept_code,
							'crse_in':self.course['selec'],
							'crn_in':self.course['ident']
						}

						section = self.requester.get(self.url + '/PRODCartridge/bwckschd.p_disp_listcrse', params=query4)

						course = self.course.create_course()

						# parse scheduling info
						meeting_times = GWParser.extract_meeting_times(section)

						# collect instr info
						self.course['instrs'] = ', '.join((mt.find_all('td')[6].text for mt in meeting_times[:1]))
						if meeting_times:
							self.course['section_type'] = meeting_times[0].find_all('td')[5].text[0].upper()
						section = self.course.create_section(course)

						for mt in meeting_times:
							col = mt.find_all('td')
							time_range = re.match(r'(.*) - (.*)', col[1].text)
							if time_range:
								self.course['time_start'] = time_12to24(time_range.group(1))
								self.course['time_end'] = time_12to24(time_range.group(2))
								self.course['days'] = list(col[2].text)
								self.course['location'] = col[3].text
							else:
								continue
							self.course.create_offerings(section)
		self.course.wrap_up()

	def parse_catalogentrypage(self, soup):
		''' Attempts to scrape information from the (at best) ill-formatted catalog entry page.
			Includes: description, levels, areas, types, attributes

		Args:
			soup (bs4): table on catalog entry page
		'''
		fields = {}
		try:
			meat = soup.find('body').find('table', {'class':'datadisplaytable'})
			fields.update(self.extract_description(meat))
			fields.update(self.extract_otherinfo(meat))
		except AttributeError:
			sys.stderr.write('Unexpected error: at catalog entry parse for course\n' + str(self.course))
		return fields

	def extract_description(self, soup):
		return {'descr': self.scrape_description(soup)}

	def scrape_description(self, soup):
		try:
			soup = soup.find_all('tr', recursive=False)[1].find('td')
			descr = re.match(r'<td .*?>\n([^<]+)<[^$]*</td>', soup.prettify())
			if descr:
				return ' '.join(descr.group(1).strip().splitlines())
			else:
				return '' # no description
		except AttributeError:
			sys.stderr.write('Unexpected error: at catalog entry description extraction for course \n' + str(self.course))
			return ''

	def extract_otherinfo(self, soup):
		fields = self.scrape_otherinfo(soup)
		extraction = {
			'Schedule Types': ('section_type', lambda s: smart_str(s)[0].upper()),
			'Levels' : ('info', lambda s: 'Levels: ' + smart_str(s).strip()), # NOTE: this needs to be changed in db
			'Course Attributes': ('areas', lambda x: smart_str(x).strip())
		}

		extracted = {}
		for name, data in fields.items():
			if extraction.get(name):
				extracted[extraction[name][0]] = extraction[name][1](data)

		return extracted

	def scrape_otherinfo(self, soup):
		''' Attempts to scrape additional information from ill-formated course catalog entry page.
			Includes: levels, areas, types, attributes

		Args:
			soup (bs4): table on catalog entry page

		Examples:
			...
			 <span class="fieldlabeltext">
			  Levels:
			 </span>
			 Non-Degree, Undergraduate, Graduate, Consortium, Medicine, Alumni Auditor
			 <br/>
			 <span class="fieldlabeltext">
			  Schedule Types:
			 </span>
			 <a href="/PRODCartridge/bwckctlg.p_disp_listcrse?term_in=201701&amp;subj_in=PUBH&amp;crse_in=1101&amp;schd_in=L">
			  Lecture
			 </a>
			...
			 <span class="fieldlabeltext">
			  Course Attributes:
			 </span>
			 <br/>
			 ESIA-Global PH Conc (2010), ESIA-Global PH Conc (Pre 2010), Sust Minor: Green Leaf Track C, Sustainability Courses
			 <br/>
			 <br/>
			</td>
		'''
		meat = soup.find('td', {'class':'ntdefault'})
		fields = {}
		# link field in <span> tag to text proceeding it
		for t in meat.find_all('span', {'class':'fieldlabeltext'}):
			data = t.next_sibling
			while data and isinstance(data, Tag) and data.name == 'br':
				data = data.next_sibling
			if not isinstance(data,NavigableString):
				data = data.text
			fields[t.text[:-2]] = data
		return fields

	@staticmethod
	def extract_meeting_times(soup):
		meeting_times = soup.find('table', {'class':'datadisplaytable'})
		if meeting_times:
			meeting_times = meeting_times.find('table', {'class':'datadisplaytable'})
			if meeting_times:
				meeting_times = meeting_times.find_all('tr')[1:]
		if meeting_times:
			return meeting_times
		else:
			return list()

	@staticmethod
	def iserrorpage(soup):
		error = soup.find('span',{'class':'errortext'})
		if error:
			sys.stderr.write('Error on page request, message: ' + error.text + '\n')
			sys.stderr.write('^ would assume someone else logged in\n')
			return True
		else:
			return False

def main():
	gp = GWParser()
	gp.parse()

if __name__ == "__main__":
	main()
