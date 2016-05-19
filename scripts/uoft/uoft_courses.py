import requests, cookielib
# import http.cookiejar
from bs4 import BeautifulSoup
from collections import OrderedDict
import time
import re
import json
import os
import sys
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *


class UofTParser:
    """A scraper for UofT's Course Finder web service.
    Course Finder is located at http://coursefinder.utoronto.ca/.
    """

    def __init__(self):
        self.school = "uoft"
        self.cookies = cookielib.CookieJar()
        self.s = requests.Session()
        self.years_of_study = ["1", "2", "3", "4"]
        self.level_map = {"1": "100", "2": "200", "3": "300", "4": "400"}
        self.day_map = {'MO': 'M', 'TU': 'T', 'WE': 'W', 'TH': 'R', 'FR': 'F', None: ''}
        self.errors = 0
        self.host = 'http://coursefinder.utoronto.ca/course-search/search'
        self.urls = None
        self.cookies = cookielib.CookieJar()
        self.s = requests.Session()
        self.new = 0

    def get_school_name(self):
        return self.school
    def split_into_parts(self, line, n):
        return [line[i:i+n] for i in range(0, len(line), n)]
    def split_locations(self, line):
        test = re.findall(r'[A-Z]{2} \d{3,4}', line)
        if test:
            return test
        test2 = re.findall(r'[A-Z]{2} [A-Z]+\d{2}', line)
        if test2:
            return test2
        return [line]

    def start(self):
        print "Starting St. George."
        for year_of_study in self.years_of_study:
            level = self.level_map[year_of_study]
            print "Parsing year: {}".format(year_of_study)
            request_url = "https://timetable.iit.artsci.utoronto.ca/api/courses?org=&code=&section=&studyyear={}&daytime=&weekday=&prof=&breadth=".format(year_of_study)
            data = json.loads(self.s.get(url=request_url, cookies=self.cookies).text)
            for key in data:
                try:

                    course_data = data[key]
                    course_code = course_data['code']
                    num_credits = 1 if course_code[6].upper() == 'Y' else 0.5

                    C, created = Course.objects.update_or_create(code=course_code, defaults={
                            'name': course_data['courseTitle'],
                            'description': BeautifulSoup(course_data['courseDescription']).p.get_text(),
                            'campus': course_code[-1],
                            'areas': course_data['breadthCategories'][-3:],
                            'prerequisites': course_data['prerequisite'],
                            'exclusions': course_data['exclusion'],
                            'num_credits': num_credits,
                            'level': level,
                            'department': course_code[:3]
                        })
                    print "Course:", C, "New?:", created
                    if created:
                        self.new += 1
                    meetings = course_data['meetings']
                    semester = course_data['section']
                    # C.courseoffering_set.all().delete()
                    for section_key in meetings:
                        section = section_key.split("-")[0][0] + section_key.split("-")[-1]
                        section_data = meetings[section_key]
                        instructor_data = section_data['instructors']
                        instructors = ""
                        for instructor in instructor_data:
                            instructor_info = instructor_data[instructor]
                            instructors += instructor_info['firstName'] + " " + instructor_info['lastName']
                        if instructors and instructors[-1] == ",": 
                            instructors = instructors[:-1]
                        S, s_created = Section.objects.update_or_create(
                            course=C,
                            name=section, 
                            section_type=section[0],
                            semester=semester,
                            defaults={
                                'instructors': instructors,
                                'size': section_data['enrollmentCapacity'],
                                'enrolment': 0,
                        })
                        schedule = section_data['schedule']
                        
                        for offering in schedule:
                            offering_data = schedule[offering]
                            try:
                                CO, co_created = Offering.objects.update_or_create(section=S,
                                    day=self.day_map[offering_data['meetingDay']],
                                    time_start=offering_data['meetingStartTime'],
                                    time_end=offering_data['meetingEndTime'],
                                    location='')
                                           
                                CO.save()
                            except Exception as e:
                                print e
                                self.errors += 1
                                continue
                except Exception as f:
                    import traceback
                    traceback.print_exc()

        print "Total errors:", self.errors
        print "Done St. George. Now starting UTM."
        self.start_utm()


if __name__ == "__main__":
    parser = UofTParser()
    parser.start()
