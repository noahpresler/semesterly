# Semesterly
# school: University of Michigan
# file: umich course parser
# author: Amlan Nayak
# date: 

import requests
import json
import time as tm
import django
from django.utils.encoding import smart_str, smart_unicode
from time import sleep
from itertools import cycle
import sys
import os
from datetime import *
import urllib
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from amazonproduct import API 
api = API(locale='us')

DAY_MAP = {"Mo": "M", "Tu": "T", "We": "W", "Th": "R", "Fr": "F"}
SECTION_MAP = {	"LEC": "L", 
				"SEM": "L", 
				"DIS" : "T", 
				"LAB": "P", 
				"CLN" : "P", 
				"REC": "T", 
				"SMA": "T",
				"IND": "L",
				"FLD": "P",
				"CAS": "L"
			}
_DEBUG_FLAG_ = False
# Printing debug messages
def log(msg):
	if _DEBUG_FLAG_:
		log(msg)

class umichParser:
	def __init__(self, semester = "f16"):
		self.school = "umich"
		self.terms = []
		self.schools = []
		self.subjects = []
		self.semester_code_map = {'f16': '2110', 'w17':'2120'}
		self.semester_map = {'f16': 'F', 'w17': 'S'}
		self.semester = self.semester_map[semester] 
		self.term = self.semester_code_map[semester]
		self.url = "http://api-gw.it.umich.edu/Curriculum/SOC/v1/Terms"
		# ADD MOAR TOKENS!
		self.tokens = [	"6e15388418fa2483841755f5e2d5eba", "5562e94b39dccc2eaaab181e0c4ee", \
						"c03cae2d767ab4c525d1ce5b57a965", "dfccf802a589fcbdbfa6b4e906e1bb6",\
						"b0555cfc4e7f81c1a2a4b3b40b79eda", "dd233b5f3d1d3b0289618cc714078f", \
						"aa8b15285aaf42e0aabf7fcba894e584", "69f54956936d1babd0a34006d63988"]
		# cycle through the tokens without running off the end of the list
		self.tok_cyc = cycle(self.tokens)
		# Switching tokens due to 60/min limit
		self.curr_token = self.tok_cyc.next()
		# use count to send 59 requests with each token before switching 
		self.tok_count = 0
		# textbook create count
		self.create_count = 0
		# textbook identified count
		self.identified_count = 0
		# Request count = max(tok_count)*(# of tokens)		
		self.req_count = 0
		self.header = {	"Authorization" : "Bearer " + "348bb75fa18abd0a969b31721f5", \
						"Accept": 'application/json', "User-Agent": "curl/7.35.0"}	

	def start(self, get_textbooks=False, filename=None):   
		#self.get_terms()
		# Fall Semester : 2110
		# clearing json file
		if(filename):
			f= open(filename, 'w').close()
			outfile = open(filename, 'a')
			outfile.write("{\"courses\":[")
		outfile = None
		#self.terms = ['2110']
		#for term in self.terms:
		#school = "ENG"
		#subject = "EECS"
		#log("Getting Catalog Numbers")
		#cat_nums = self.get_catalog_nums(school = school, term = term, subject = subject)
		#catalog_nu = "370"
		#log("Getting couse info")

		#self.parse_catalog_nums(school=school, term=term, subject=subject, outfile=outfile, get_textbook=False)
		#The code below is to parse through all of the terms, schools, 
		#and subjects
		schools = self.get_schools(self.term)
		
		#schools = [{"SchoolCode": "ENG"}]
		for school in schools:
			log("Getting subjects for school " + str(school['SchoolCode']))
			subjects = self.get_subjects(school['SchoolCode'], self.term)
			#subjects = {"SubjectCode":"EECS"}
			if(not subjects):
				continue
			# If there is a single subject, a dict will be returned
			if(type(subjects) == dict):
				log("Getting Catalog Numbers for subject" + subjects['SubjectCode'])
				self.parse_catalog_nums(school = school['SchoolCode'], term = self.term, \
										subject = subjects['SubjectCode'], outfile=outfile, get_textbook=get_textbooks)
			else: # a list of subjects was returned
				for subject in subjects:
					log("Getting Catalog Numbers for subject " + str(subject['SubjectCode']))
					self.parse_catalog_nums(school = school['SchoolCode'], term = self.term, \
											subject = subject['SubjectCode'], outfile=outfile, get_textbook=get_textbooks)
		# Removing the last comma
		if(outfile):
			outfile.seek(-1, os.SEEK_END)
			outfile.truncate()
			outfile.write("]}")
			outfile.close()
		print("Wrapping up!")
		self.wrap_up()
		#return course_list

	def parse_catalog_nums(self, school, term, subject, outfile=None, get_textbook=False):
		# get the catalog numbers for a subject and retrieve course information 
		# for each of the catalog numbers
		cat_nums = self.get_catalog_nums(school = school, term = term, subject = subject)
		#cat_nums = ["427", "582"]
		if(not cat_nums):
			return
		elif(type(cat_nums) == dict):
			log("Getting Course Information for catalog number " + str(num))
			course_writable = self.get_course_info(	term = term, 
													school = school['SchoolCode'], 
													subject = subject['SubjectCode'], 
													cat_num = num, 
													get_textbook = get_textbook
												)
			if(outfile):
				outfile.write(course_writable)
				outfile.write(",")
		for num in cat_nums:
			# This course's information is all "Null"
			if(num == '521B'):
				continue
			log("Getting Course Information for catalog number " + str(num))
			course_writable = self.get_course_info(	term = term, 
													school = school, 
													subject = subject, 
													cat_num = num, 
													get_textbook = get_textbook
												)
			log(outfile)
			if(outfile):
				outfile.write(course_writable)
				outfile.write(",")

	def wrap_up(self):
		update_object, created = Updates.objects.update_or_create(
			school = self.school,
			update_field = "Course",
			defaults = {'last_updated': datetime.now()}
		)
		update_object.save()

	def get_terms(self):
		resp = self.get_url(self.url)
		term_dict = json.loads(resp)
		term_list = term_dict['getSOCTermsResponse']['Term']
		for key in term_list:
			self.terms.append(key['TermCode'])
		return term_list

	def get_schools(self, term):
		schools_url = self.url + "/" + str(term) + "/Schools"
		resp = self.get_url(schools_url)
		school_list = json.loads(resp)['getSOCSchoolsResponse']['School']
		for item in school_list:
			self.schools.append(item['SchoolCode'])
		return school_list

	def get_subjects(self, school, term):
		subjects_url = self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/"
		resp = self.get_url(subjects_url)
		subjects_list = []
		try:
			subjects_list = json.loads(resp)['getSOCSubjectsResponse']['Subject']
		except KeyError:
			log("Subjects list empty!")
		#if type(subjects_list) is not list:
		#	return subjects_list
		#for item in subjects_list:
		#	self.subjects.append(item['SubjectCode'])
		return subjects_list

	def get_catalog_nums(self, school, term, subject):
		cat_url = self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/" + \
					str(subject) + "/CatalogNbrs"
		resp = self.get_url(cat_url)
		try:
			resp_list = json.loads(resp)['getSOCCtlgNbrsResponse']['ClassOffered']
		except KeyError:
			log("No catalog numbers found!")
			return []
		try:
			cat_num_list = [item["CatalogNumber"] for item in resp_list]
		except TypeError:
			cat_num_list = [resp_list["CatalogNumber"]]
		return cat_num_list

	def get_course_info(self, term, school, subject, cat_num, get_textbook=False):
		# first, get class number
		log("Getting class number for class " + str(subject) + str(cat_num))
		class_num = self.get_class_num(term, subject, cat_num)
		if(class_num == 0):
			return
		# use class number to get course information
		course_url = self.url + "/" + str(term) + "/Classes/" + str(class_num)
		#sleep(1.01)
		resp = self.get_url(course_url)
		if((resp == []) | (resp == 500) | (resp == 400)):
			return
		try:
			course_info = json.loads(resp)['getSOCSectionListByNbrResponse']['ClassOffered']
		except KeyError:
			log("Course info not found! Course was not created")
			return 
		# get course description
		log("Getting description for class " + str(subject) + str(cat_num))
		descr_url = self.url + "/" + str(term) + "/Schools/" + str(school) + \
					"/Subjects/" + str(subject) + "/CatalogNbrs/" + str(cat_num)
		#sleep(1.01)
		course_descr = self.get_course_descr(descr_url)
		course_info["Description"] =  course_descr
		# create course module
		log("Updating course model for class " + str(subject) + str(cat_num))
		# Adding course to DB
		course_model = self.create_or_update_course(course_info)

		#DEBUG
		log("DONE")

		# get sections for this course
		section_url = descr_url + "/Sections/"
		log("Getting Sections for class " + str(subject) + str(cat_num))
		sections = self.get_sections(section_url)
		if(sections == None):
			log("Sections not found due to 500 ERROR")
			return
		#self.parse_all_sections(course_model = course, sections = sections)
		#section_writables = [] # list of dicts for all sections/meetings
		for section in sections:
			section_num = section['SectionNumber']
			#log("Getting meetings for class " + str(subject) + str(cat_num))
			meeting  = self.get_course_meeting(term = term, school = school, subject = subject, cat_num = cat_num, section = section_num)
			if(meeting == None):
				log("Meetings not found due to 500 ERROR")
				continue
			# writing section info into DB
			self.create_section(meeting = meeting, course_model = course_model, input_section = section)
			# Getting textbook 
			if(get_textbook & (section['SectionType'] == 'LEC')):
				log("Getting textbook information")
				textbook_info = self.get_textbooks( term = term, school = school, subject = subject, cat_num = cat_num, section = section_num)
				if(not textbook_info):
					log("No info found!")
					continue
				elif(textbook_info == 'ZyBooks'):
					log("Using ZyBooks")
					continue
				isbn = str(textbook_info['ISBN'])
				self.make_textbook(required = True,  isbn_number = isbn , cat_num = cat_num, section = section)
			#section_element = {
			#	'section_code': section_num,
			#	'section_data': section,
			#	'meeting': meeting
			#}
			#section_writables.append(section_element)
			'''
			if(get_textbook):
				self.get_textbooks()
			'''
		# Writing course information to JSON file
		#course_writable = {
		#	'course_code': str(subject) + str(course_info["CatalogNumber"]),
		#	'course_data': course_info,
		#	'sections': section_writables
		#}

		#return json.dumps(course_writable)
		#log(sections[0]['Meeting']['Days'])

	def get_class_num(self, term, subject, cat_num):
		class_num_url = self.url + "/" + str(term) + "/Classes/Search/" + str(subject) + "%20" + str(cat_num)
		resp = self.get_url(class_num_url)
		if((resp == []) | (resp == 500) | (resp == 400)):
			return 0
		try:
			resp_list = json.loads(resp)['searchSOCClassesResponse']['SearchResult']
			try:
				return resp_list["ClassNumber"]
			except TypeError:
				return resp_list[0]["ClassNumber"]
		except KeyError:
			log("Class number not found!")
			return []

	def get_course_descr(self, course_url):
		resp = self.get_url(course_url)
		descr = ''
		if((resp == []) | (resp == 500) | (resp == 400)):
			return "Not found"
		try:
			descr = json.loads(resp)['getSOCCourseDescrResponse']['CourseDescr']
			if((descr == 'null') or (descr is None)):
				return ''
		except KeyError:
			log("Course description not found!")
			descr = 'No description found!'
		return descr

	def get_course_meeting(self, term, school, subject, cat_num, section):
		meeting_url = self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/" + \
						str(subject) + "/CatalogNbrs/" + str(cat_num) + "/Sections/" + str(section) + \
						"/Meetings"
		resp = self.get_url(meeting_url)
		if((resp == []) | (resp == 500) | (resp == 400)):
			return None
		try:
			meeting_info = json.loads(resp)['getSOCMeetingsResponse']['Meeting']
			return meeting_info
		except KeyError:
			log("Meeting time error!")
			return []

	def get_sections(self, sections_url):
		resp = self.get_url(sections_url)
		if((resp == []) | (resp == 500) | (resp == 400)):
			return None
		try:
			section_list = json.loads(resp)['getSOCSectionsResponse']['Section']
			if not isinstance(section_list, list):
				section_list = [section_list]
			return section_list
		except KeyError:
			log("Caught sections error!")
			return []
		
	def get_textbooks(self, term, school, subject, cat_num, section):
		textbook_url = self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/" + \
						str(subject) + "/CatalogNbrs/" + str(cat_num) + "/Sections/" + str(section) + \
						"/Textbooks"
		resp = self.get_url(textbook_url)
		if((resp == []) | (resp == 500) | (resp == 400)):
			return None		
		try:
			textbook_info = json.loads(resp)['getSOCTextbooksResponse']['Textbook']
			if(type(textbook_info) == list):
				textbook_info = textbook_info[0]
			# No textbook information returned from API
			if((textbook_info == 'null') or (textbook_info is None)):
				return 'TBD'
			# Course uses Zybooks online
			elif((textbook_info["ISBN"] == None)):
				return 'ZyBooks'
		except KeyError:
			return 'No textbook information found'
		return textbook_info

	def get_detail_page(self, result):
		try:
			return smart_str(result.Items.Item.DetailPageURL)
		except:
			return "Cannot Be Found"

	def get_image_url(self, result):
		try:
			return smart_str(result.Items.Item.MediumImage.URL)
		except:
			return "Cannot Be Found"

	def get_author(self,result):
		try:
			return smart_str(result.Items.Item.ItemAttributes.Author)
		except:
			return "Cannot Be Found"

	def get_title(self,result):
		try:
			return smart_str(result.Items.Item.ItemAttributes.Title)
		except:
			return "Cannot Be Found"

	def get_amazon_fields(self,isbn):
		try:
			result = api.item_lookup(isbn.strip(), IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
			info = {
				"DetailPageURL" : self.get_detail_page(result),
				"ImageURL" : self.get_image_url(result),
				"Author" : self.get_author(result),
				"Title" : self.get_title(result)
			}
		except:
			import traceback
			traceback.print_exc()
			info = {
				"DetailPageURL" : "Cannot be found",
				"ImageURL" : "Cannot be found",
				"Author" : "Cannot be found",
				"Title" : "Cannot be found"
			}
		return info

	def make_textbook(self, required, isbn_number, cat_num, section):
		try:
			course = Course.objects.filter(code__contains = cat_num, school = 'umich')[0]
		except IndexError:
			log("index error (course does not exist): " + cat_num)
			return
		sections = Section.objects.filter(course = course, meeting_section = section)
		info = self.get_amazon_fields(isbn_number)

		# update/create textbook
		textbook_data = {
			'detail_url': info['DetailPageURL'],
			'image_url': info["ImageURL"],
			'author': info["Author"],
			'title': info["Title"]
		}
		textbook, created = Textbook.objects.update_or_create(
			isbn=isbn_number,
			defaults=textbook_data
		)

		self.create_count += int(created)

		# link to all course offerings
		for section in sections:
			section, created = self.textbook_link.objects.update_or_create(
				is_required = is_required,
				section = section,
				textbook = textbook
			)

		# log results
		if created:
			try:
				log("Textbook created: " + str(textbook.title))
			except UnicodeEncodeError:
				pass
		else:
			self.identified_count += 1
			try:
				log("Textbook found, not created: " + str(textbook.title))
			except UnicodeEncodeError:
				pass

	def create_or_update_course(self, course_info):
		cat_num = course_info["CatalogNumber"]
		title = course_info["CourseDescr"]
		subject = course_info["SubjectCode"]
		try:
			cat_num = int(cat_num)
		except ValueError:
			cat_num = int(re.findall(r"[0-9]+", cat_num)[0])
		credits = 0
		# What to do for multiple credit courses? Just taking minimum
		if(type(course_info['CreditHours']) == int):
			credits = course_info['CreditHours']
		else:
			log(type(course_info['CreditHours']))
			# Checking if credits field is empty
			try:
				credits = float(course_info['CreditHours'].split(" - ")[0])
			except AttributeError:
				credits = float(0) # use 0 if empty
		try:
			courses = Course.objects.filter(school = "umich", code = cat_num, \
										name = title, department=subject)
			courses.update(code = str(subject) + " " + str(cat_num))
		except Course.DoesNotExist:
			pass
		print smart_str(str(subject) + " " + str(cat_num))
		matches = Course.objects.filter(code = str(subject) + " " + str(cat_num),
                        school = self.school,
                        department = subject,
                        campus = 1)
		if matches.count() > 1:
			for c in matches[1:]:
				c.delete()
			#print smart_str("Deleting stale course")
		course, CourseCreated = Course.objects.update_or_create(
			code = str(subject) + " " + str(cat_num),
			school = self.school,
			department = subject,
			campus = 1,
			defaults = {
				'name' : title,
				'description' : course_info['Description'],
				'areas' : course_info['Acad_Group'],
				'prerequisites' : '',
				'num_credits' : credits,
				'level' : (int(cat_num)/100)*100
			}
		)
		return course
			#self.create_course_offerings(self, course,)
	def create_section(self, meeting, course_model, input_section):
		instr_name = ''
		try:
			instr_name = input_section['ClassInstructors']['InstrName']
		except TypeError:
			instr_list = [name['InstrName'] for name in input_section['ClassInstructors']]
			# Truncating instructor list since it could exceed character limit
			instr_list = instr_list[:10]
			instr_name = ",".join(instr_list)
		except KeyError:
			try:
				instr_name = input_section['Meeting']['Instructors']
			except TypeError:
				instr_name = input_section['Meeting'][0]['Instructors']
			except KeyError:
				instr_name = 'TBA'
		# Getting rid of duplicates
		matches = Section.objects.filter(course = course_model, meeting_section=input_section['SectionNumber'])
		if matches.count() > 1:
			for c in matches[1:]:
				c.delete()
			#print smart_str("Deleting Stale section for {}".format(course_model.code))
		# Find all existing offerings for section and delete them
		if Section.objects.filter(course = course_model, meeting_section = input_section['SectionNumber']).exists():
			s = Section.objects.get(course = course_model, meeting_section = input_section['SectionNumber'])
			#print smart_str("Deleting stale meeting for {}".format(course_model.code + " " + str(input_section['SectionNumber'])))
			Offering.objects.filter(section = s).delete()

		# Section type defaults to "L" if not found in dict
		sect_type = SECTION_MAP.get(input_section['SectionType'], "L")
		section, section_created = Section.objects.update_or_create(
			course = course_model,
			meeting_section = input_section['SectionNumber'],
			size = input_section['EnrollmentCapacity'],
			enrolment = input_section['EnrollmentTotal'],
			waitlist = input_section['WaitTotal'],
			waitlist_size = input_section['WaitCapacity'],
			section_type = sect_type, #SECTION_MAP[input_section['SectionType']],
			instructors = instr_name,
			semester = self.semester[0].upper()
		)
		#section.save()
		
		if(isinstance(meeting, list)):
			for mtg in meeting:
				self.create_offering(meeting = mtg, section = section)
		else:
			self.create_offering(meeting = meeting, section = section)
		return section
	
	def create_offering(self, meeting, section):
		days = meeting['Days']
		time = meeting['Times']
		if(time == 'TBA'):
			start_time = ''
			end_time = ''
			#print("NOT FOUND: timing information for offering")
			return
		else:
			time12 = re.match("(.*) \- (.*)", time)
			try:
				start_time = self.convert_time(time12.group(1))
			except ValueError:
				start_time = 'TBA'	
			try:
				end_time = self.convert_time(time12.group(2))
			except ValueError:
				end_time = 'TBA'

		# Matching regex to received meeting days
		for day_encoding in re.findall(r"([A-Z][a-z]*)+?", days):
			try:
				day = DAY_MAP[day_encoding]
			except (KeyError,ValueError):
				# NOT RESOLVED: what to do about TBA days? 
				#day = 'T'
				return 
			offering, OfferingCreated = Offering.objects.update_or_create(
				section = section,
				day = day,
				time_start = start_time,
				time_end = end_time,
				location = str(meeting['Location'])
			)
			#offering.save()

	@staticmethod
	def convert_time(time):
		# Regex matching
		match = re.match("(\d*):(\d*)(.)", time)

		# Transform to 24hr
		hours = int(match.group(1))
		minutes = match.group(2)
		if re.search(r'[pP]', match.group(3)):
			hours = (hours%12)+12

		# Returning as string
		return str(hours) + ":" + str(minutes)

	def get_url(self, url):
		# Switch token every 60 requests due to throttling
		if(self.tok_count == 60):
			self.tok_count = 0
			self.curr_token = self.tok_cyc.next()
			print("Current token: {}".format(self.curr_token))
		# Wait after cycling through every token
		if(self.req_count == len(self.tokens)*60):
			self.req_count = 0
			#self.curr_token = self.tok_cyc.next()
			sleep(60)
		header = {"Authorization" : "Bearer " + str(self.curr_token), "Accept": 'application/json', "User-Agent": "curl/7.35.0"}	
		while True:
			try:
				r = requests.get(url, headers = header, verify = True)
				self.tok_count += 1
				self.req_count +=1
				if r.status_code == 200:
					#log("SUCCESS!")
					return r.text
				elif r.status_code == 500:
					# Wait and retry
					log("Encountered 500, retrying")
					sleep(0.25)
					r = requests.get(url, headers = header, verify = True)
					if(r.status_code == 500):
						log("Bad status code: " + str(r.status_code))
						log(r.text)
						return 500
					else:
						return r.text
				elif r.status_code == 404:
					log("Bad status code: " + str(r.status_code))
					return 404
				else:
					print("Token throttled!")
			except(requests.exceptions.Timeout, 
					requests.exceptions.ConnectionError):
				log("Unexpected Errror") 
				continue 
		

def main():
	parser = umichParser(semester='w17')
	start = tm.time()
	log("Starting Parser")
	parser.start(get_textbooks=False)
	end = tm.time()
	log("TIME: " + str(end - start))

if __name__ == "__main__":
	main()
