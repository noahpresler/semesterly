from time import sleep
import json
import requests, cookielib
import os
import sys, traceback
from toolz import itertoolz
from collections import OrderedDict
import re
import django
import datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
import urllib2
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
        self.wrap_up()

    def get_schools(self):
        url = API_URL + '/codes/schools?key=' + KEY
        self.schools = self.get_json(url)

    def parse_schools(self):
        for school in self.schools:
            self.parse_school(school)

    def wrap_up(self):
        update_object, created = Updates.objects.update_or_create(
            school=self.school,
            update_field="Course",
            defaults={'last_updated': datetime.datetime.now()}
        )
        update_object.save()

    def parse_school(self,school):
        courses = self.get_courses(school)
        for course in courses:
            section = self.get_section(course)
            try:
                self.process_place_times(course,section)
            except:
                print "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
                traceback.print_tb(sys.exc_info()[2], file=sys.stdout)

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
        try:
            SectionDetails = section[0]['SectionDetails']
            Meetings = SectionDetails[0]['Meetings']
            SectionCode = section[0]['SectionName']
            Description = SectionDetails[0]['Description']
        except IndexError:
            return

        PreReqs = ''
        try:
            PreReqs = SectionDetails[0]['Prerequisites'][0]['Description']
        except:
            pass
        CourseModel = self.get_create_course(course,Description,PreReqs)
        self.create_course_offerings(course,CourseModel,SectionDetails,Meetings,SectionCode)

    def create_course_offerings(self, course, CourseModel, SectionDetails, Meetings, SectionCode):
        wrapped_code = "(" + str(SectionCode) + ")"
        section, section_created = Section.objects.update_or_create(
                course = CourseModel,
                semester = self.semester[0].upper(),
                meeting_section = wrapped_code,
            )
        Offering.objects.filter(section = section).all().delete()
        for Meeting in Meetings:
            try:
                section_size = int(course['MaxSeats'])
            except:
                section_size = 0
            try:
                section_enrolment=int(course['SeatsAvailable'].split("/")[0])
            except:
                section_enrolment=0

            section, section_created = Section.objects.update_or_create(
                course = CourseModel,
                semester = self.semester[0].upper(),
                meeting_section = wrapped_code,
                defaults = {
                    'instructors': course['Instructors'],
                    'size': section_size,
                    'enrolment': section_enrolment
                }
            )

            times = Meeting['Times']
            for time in times.split(','):
                if len(time) > 0:
                    time_pieces = re.search(r"(\d\d):(\d\d) ([AP])M - (\d\d):(\d\d) ([AP])M",time)
                    hours = [None] * 2
                    start_hour = int(time_pieces.group(1))
                    end_hour = int(time_pieces.group(4))
                    if time_pieces.group(3).upper() == "P" and time_pieces.group(1) != "12":
                        start_hour += 12
                    if time_pieces.group(6).upper() == "P" and time_pieces.group(4) != "12":
                        end_hour += 12
                    if start_hour < 10:
                        start_hour = "0" + str(start_hour)
                    if end_hour < 10:
                        end_hour = "0" + str(end_hour)
                    start = str(start_hour) + ":" + time_pieces.group(2)
                    end = str(end_hour) + ":" + time_pieces.group(5)
                    days = Meeting['DOW']
                    if days != "TBA" and days !="None":
                        for day_letter in re.findall(r"([A-Z][a-z]*)+?",days):
                            day = DAY_TO_LETTER_MAP[day_letter.lower()]
                            location = Meeting['Building'] + ' ' + Meeting['Room']

                            offering, OfferingCreated = Offering.objects.update_or_create(
                                section = section,
                                day = day,
                                time_start = start,
                                time_end = end,
                                defaults = {
                                    'location':location
                                }
                            )

    def get_create_course(self,courseJson,description,prereqs):
        areas = courseJson['Areas'].replace('^',',')
        if courseJson['IsWritingIntensive'] == "Yes":
            areas = areas + ', Writing Intensive'
        try:
            num_credits=int(float(courseJson['Credits']))
        except:
            num_credits=0
        level = re.search(re.compile(r"(?<=\.)[^.]"),courseJson['OfferingName']).group(0) + "00"

        course, CourseCreated = Course.objects.update_or_create(
            code = courseJson['OfferingName'].strip(),
            school = 'jhu',
            campus = 1,
            defaults={
                'name': courseJson['Title'],
                'description': description,
                'areas': areas,
                'prerequisites': prereqs,
                'num_credits': num_credits,
                'level': level,
                'department': courseJson['Department']
            }
        )
        return course

    def get_json(self, url):
        while True:
            try:
                r = self.s.get(url,cookies=self.cookies,headers=self.headers,verify=True)
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