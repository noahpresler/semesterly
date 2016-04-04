from time import sleep
import json
import requests, cookielib
import os
import sys
from toolz import itertoolz
from collections import OrderedDict
import re
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
import urllib2
import json
from fake_useragent import UserAgent
from pprint import pprint


API_URL = 'https://isis.jhu.edu/api/classes/'
KEY = '***REMOVED***'
DAY_TO_LETTER_MAP = {'m': 'M',
		't': 'T',
		'w': 'W',
		'th': 'R',
		'f': 'F',
		'sa': 'S',
		's': 'U'}



class HopkinsParser:

	def safe_print(self,to_print):
		try:
			print to_print
		except UnicodeEncodeError:
			print "Print statement omitted for UnicodeEncodeError."

	def __init__(self, sem="Fall 2016"):
		self.school = "jhu"
		self.s = requests.Session()
		self.cookies = cookielib.CookieJar()
		self.headers = {
			'User-Agent': 'Mozilla/5.0'
		}
		self.semester = sem
		self.safe_print("Parsing Data For: " + self.semester + " Semester")
		self.schools = []
		self.departments = []

	def start(self):
		self.get_schools()
		self.parse_schools()

	def get_schools(self):
		url = API_URL + '/codes/schools?key=' + KEY
		self.schools = self.get_json(url)

	def parse_schools(self):
		for school in self.schools:
			self.parse_school(school)

	def parse_school(self,school):
		courses = self.get_courses(school)
		for course in courses:
			section = self.get_section(course)
			self.process_place_times(course,section)

	def get_section(self,course):
		url = API_URL + '/' + course['OfferingName'].replace(".", "") + course['SectionName'] +'/' + self.semester + '?key=' + KEY
		return self.get_json(url)

	def get_courses(self,school):
		print "Getting courses in: " + school['Name']
		url = API_URL + '/' + school['Name'] + '/'+ self.semester + '?key=' + KEY
		courses = self.get_json(url)
		return courses

	def get_departments(self,school):
		url = API_URL + '/codes/departments/' + school['Name'] + '?key=' + KEY
		self.departments = self.get_json(url)

	def process_place_times(self,course,section):
		SectionDetails = section[0]['SectionDetails']
		Meetings = SectionDetails[0]['Meetings']
		SectionCode = section[0]['SectionName']
		Description = SectionDetails[0]['Description']
		PreReqs = ''
		try:
			PreReqs = SectionDetails[0]['Prerequisites'][0]['Description']
		except:
			pass
		CourseModel = self.get_create_course(course,Description,PreReqs)
		self.create_course_offerings(course,CourseModel,SectionDetails,Meetings,SectionCode)

	def create_course_offerings(self,course,CourseModel,SectionDetails,Meetings,SectionCode):
		for Meeting in Meetings:
			time = Meeting['Times']
			if len(time) > 0:
				time_pieces = re.search(r"(\d\d):(\d\d) ([AP])M - (\d\d):(\d\d) ([AP])M",time)
				hours = [None] * 2
				start_hour = int(time_pieces.group(1))
				end_hour = int(time_pieces.group(4))
				if time_pieces.group(3).upper() == "P" and time_pieces.group(1) != "12":
					start_hour += 12
				if time_pieces.group(6).upper() == "P" and time_pieces.group(4) != "12":
					end_hour += 12
				start = str(start_hour) + ":" + time_pieces.group(2)
				end = str(end_hour) + ":" + time_pieces.group(5)
				days = Meeting['DOW']
				if days != "TBA" and days !="None":
					for day_letter in re.findall(r"([A-Z][a-z]*)+?",days):
						day = DAY_TO_LETTER_MAP[day_letter.lower()]
						cos = HopkinsCourseOffering.objects.filter(
							course=CourseModel,
							semester=self.semester[0].upper(),
							meeting_section=SectionCode)
						links = []
						for co in cos:
							links += HopkinsLink.objects.filter(courseoffering=co)
						cos.delete()
						offering, OfferingCreated = HopkinsCourseOffering.objects.get_or_create(
							course=CourseModel,
							semester=self.semester[0].upper(),
							meeting_section=SectionCode,
							day=day,
							time_start=start,
							time_end=end,
							instructors=course['Instructors'])
						offering.save()
						for l in links:
							l.courseoffering = offering
							l.save()
						offering.location=Meeting['Building'] + ' ' + Meeting['Room']
						try:
							offering.size=int(course['MaxSeats'])
						except:
							offering.size=0
						try:
							offering.enrolment=int(course['SeatsAvailable'].split("/")[0])
						except:
							offering.enrolment=0
						offering.save()



	def get_create_course(self,courseJson,description,prereqs):
		course, CourseCreated = HopkinsCourse.objects.get_or_create(
			code=courseJson['OfferingName'],
			campus=1)
		course.name=courseJson['Title']
		course.description=description
		course.prerequisites=prereqs
		try:
			course.num_credits=int(float(courseJson['Credits']))
		except:
			course.num_credits=0
		if CourseCreated:
			course.save()
		else:
			course.save()
		return course


	def get_json(self, url):
		while True:
			try:
				r = self.s.get(url,cookies=self.cookies,headers=self.headers,verify=False)
				if r.status_code == 200:
					return r.json()
				elif r.status_code == 500:
					print "Bad status code: " + str(r.status_code)
					return []
				elif r.status_code == 404:
					print "Bad status code: " + str(r.status_code)
					return []
			except (requests.exceptions.Timeout,
				requests.exceptions.ConnectionError):
				print "Unexpected error:", sys.exc_info()[0]
				continue

if __name__ == "__main__":
	parser = HopkinsParser()
	parser.start()