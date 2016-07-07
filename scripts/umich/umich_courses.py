import requests
import json
from time import sleep
import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
# Get Terms
# self.terms =[list of terms] *Hardcode to current term**
# foreach term in terms get schools
# foreach school search for /schools/subjects
# foreach subjectcode, request the catalog numbbers
# foreach catalog number, get course description, instructors, and details of class section
# Course1: Section A: details
# Course2: Section B: details
# Course code, name, description, prereqs, credits, areas, section code, size of section, number of seats taken, instructors
# class should have start() method

class umich_parser:
	def __init__(self):
		self.terms = []
		self.schools = []
		self.course_data = {}
		self.courses = []
		self.subjects = []
		self.req_count = 0
		self.url = "http://api-gw.it.umich.edu/Curriculum/SOC/v1/Terms"
		self.header = {	"Authorization" : "Bearer " + "348bb75fa18abd0a969b31721f5", \
						"Accept": 'application/json', "User-Agent": "curl/7.35.0"}	

	def get_terms(self):
		r = requests.get(self.url, headers=self.header)
		self.req_count += 1
		term_dict = json.loads(r.text)
		term_list = term_dict['getSOCTermsResponse']['Term']
		for key in term_list:
			self.terms.append(key['TermCode'])
		return term_list

	def get_schools(self, term):
		schools_url = self.url + "/" + str(term) + "/Schools"
		r = requests.get(schools_url, headers=self.header)
		self.req_count += 1
		school_list = json.loads(r.text)['getSOCSchoolsResponse']['School']
		for item in school_list:
			self.schools.append(item['SchoolCode'])
		return school_list

	def get_subjects(self, school, term):
		subjects_url = self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/"
		r = requests.get(subjects_url, headers = self.header)
		self.req_count += 1
		subjects_list = json.loads(r.text)['getSOCSubjectsResponse']['Subject']
		for item in subjects_list:
			self.subjects.append(item['SubjectCode'])
		return subjects_list

	def get_courses(self, term, school, subject):   
		courses_url =	self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/" + \
						str(subject) + "/CatalogNbrs"
		r = requests.get(courses_url, headers = self.header)
		self.req_count += 1
		try:
			course_list = json.loads(r.text)['getSOCCtlgNbrsResponse']['ClassOffered']
			if not isinstance(course_list, list):
				course_list = [course_list]
		except KeyError:
			course_list = []
		for item in course_list:
			self.courses.append(item['CatalogNumber'])
		return course_list

	def get_sections(self, term, school, subject, course_num):
		sections_url = 	self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/" + \
						str(subject) + "/CatalogNbrs/" + str(course_num) + "/Sections"

		r = requests.get(sections_url, headers = self.header)
		self.req_count += 1
		try:
			section_list = json.loads(r.text)['getSOCSectionsResponse']['Section']
			if not isinstance(section_list, list):
				section_list = [section_list]
			return section_list
		except KeyError:
			print("Caught sections error!")
			return []

	def start(self):
		term = "2110"
		self.get_schools(term)
		# sections = self.get_sections(term = "2110", school = "ENG", subject = "EECS", course_num = "470")
		# for section in sections:
		# 	for k,v in section.items():
		# 		print(k,v)
		for school in self.schools:
			self.get_subjects(school = school, term = term)
			for subject in self.subjects:
				courses = self.get_courses(term = term, school = school, subject = subject)
				for course in courses:
					print course
					sections = self.get_sections(term = term, school = school, subject = subject, course_num = course["CatalogNumber"])
					for section in sections:
						print "SECTION" + str(section)
						for k,v in section.items():
							print(k,v)    				
		

def main():
	parser = umich_parser()
	parser.start()

if __name__ == "__main__":
	main()
