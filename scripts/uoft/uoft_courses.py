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
        self.DAY_MAP = {'MO': 'M', 'TU': 'T', 'WE': 'W', 'TH': 'R', 'FR': 'F', None: ''}
        self.errors = 0

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

    def start_utm(self):

        print "Parsing UTM"
        level_map = {"1": "100", "2": "200", "3": "300", "4": "400"}
        found_map = {"1": 0, "2": 0, "3": 0, "4": 0}
        for year_of_study in self.years_of_study:
            payload = {
                'yos': year_of_study, 
                'subjectarea': '0',
                'session': '20169',
                'course': '',
                'instr_sname': ''
            }
            response = requests.post("https://student.utm.utoronto.ca/timetable/formatCourses2.php", data=payload).text
            f = open('example.html', 'w')
            f.write(response)
            f.close()
            soup = BeautifulSoup(response)
            level = level_map[year_of_study]
            course_divs = soup.find_all("div", class_="course")
            for course_div in course_divs:
                course_span = course_div.find('span')
                code = course_span['id'][:8]
                name = course_span.text.strip().split("-")[-1]

                try:
                    name = name[:re.search('\((HUM|SSc|SCI|EXP).*?\)', name).start()]
                except:
                    pass

                semester = course_span['id'][-1]
                course_desc_and_excl = course_span['title']

                try:
                    desc_end_index = re.search(r'\[\d.+\]', course_desc_and_excl).start()
                except:
                    desc_end_index = len(course_desc_and_excl)
                assert desc_end_index > 0
                description = course_desc_and_excl[:desc_end_index].strip()
                prerequisites = ''
                exclusions = ''
                desc_excl_soup = BeautifulSoup(course_desc_and_excl)


                excl_or_prereq = desc_excl_soup.find('strong')

                if excl_or_prereq:
                    if 'exclusion' in excl_or_prereq.text.lower():
                        exclusions = desc_excl_soup.find('strong').nextSibling
                        try:
                            maybe_prereqs = exclusions.nextSibling.nextSibling.nextSibling
                            if 'prerequisite' in maybe_prereqs.text.lower():
                                prerequisites = maybe_prereqs.nextSibling
                        except:
                            pass
                    elif 'prerequisite' in excl_or_prereq.text.lower():
                        prerequisites = desc_excl_soup.find('strong').nextSibling.string

                try:
                    exclusions = exclusions.text
                except:
                    pass
                try:
                    prerequisites = prerequisites.text
                except:
                    pass
                num_credits = 1 if code[6].upper() == 'Y' else 0.5

                C, created = Course.objects.update_or_create(code=code, defaults={
                    'name': name,
                    'description': description,
                    'campus': code[-1],
                    'prerequisites': prerequisites,
                    'exclusions': exclusions,
                    'num_credits': num_credits,
                    'level': level
                })
                print "Course:", C, "New?:", created
                C.courseoffering_set.all().delete()
                section_data = []
                section_data_table = course_div.find('table')
                tbody = section_data_table.find('tbody')
                rows = tbody.find_all('tr')
                for section in rows:
                    cols = section.find_all('td')
                    cols = [ele.text.strip() for ele in cols]
                    section_data.append([ele for ele in cols])

                print "\tOfferings:"

                for si in section_data:
                    section, instructors, enrolment, size, waitlist = si[2], si[3], si[4], si[5], si[6]
                    section = section[0] + section[3:]
                    section_type = section[0]
                    assert section_type in ['L', 'T', 'P']
                    days = self.split_into_parts(si[7], 2)
                    start_times = self.split_into_parts(si[8], 5)
                    end_times = self.split_into_parts(si[9], 5)
                    locations = self.split_locations(si[10])
                    if si[10] == "":
                        locations = ['']*len(days)
                    if len(locations) == 2*len(days) or code[:-2] in ['FAS147', 'FAS247', 'FAS343', 'FAS447']:
                        locations = locations[:len(days)]
                    if len(locations) != len(days):
                        print "Failed on:",code, "Locations:",locations, "Days:",days, "Section:",section 
                    assert len(days) == len(start_times) == len(end_times) == len(locations)
                    print "\t\tSection:", section
                    for o in xrange(len(days)):
                        day, start, end, loc = days[o], start_times[o], end_times[o], locations[o]
                        if day not in self.DAY_MAP:
                            print "==============ERROR: Day", day, " is not valid!=============="
                            continue
                        CO = CourseOffering(course=C, 
                            semester=semester,
                            meeting_section=section,
                            instructors=instructors,
                            day=self.DAY_MAP[day],
                            time_start=start,
                            time_end=end,
                            location=loc,
                            size=size,
                            enrolment=enrolment,
                            alternates=False,
                            section_type=section_type)
                        CO.save()
                        print "\t\t\t", day, start, end, loc

    def start(self):
        print "Starting St. George."
        for year_of_study in self.years_of_study:
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
                            'num_credits': num_credits
                        })
                    print "Course:", C, "New?:", created
                    meetings = course_data['meetings']
                    semester = course_data['section']
                    C.courseoffering_set.all().delete()
                    for section_key in meetings:
                        section = section_key.split("-")[0][0] + section_key.split("-")[-1]
                        section_data = meetings[section_key]
                        schedule = section_data['schedule']
                        instructor_data = section_data['instructors']
                        instructors = ""
                        for instructor in instructor_data:
                            instructor_info = instructor_data[instructor]
                            instructors += instructor_info['firstName'] + " " + instructor_info['lastName']
                        if instructors and instructors[-1] == ",": 
                            instructors = instructors[:-1]
                        for offering in schedule:
                            offering_data = schedule[offering]
                            try:
                                CO = CourseOffering(course=C, 
                                    semester=semester,
                                    meeting_section=section,
                                    instructors=instructors,
                                    day=self.DAY_MAP[offering_data['meetingDay']],
                                    time_start=offering_data['meetingStartTime'],
                                    time_end=offering_data['meetingEndTime'],
                                    location='',
                                    size=section_data['enrollmentCapacity'],
                                    enrolment=0,
                                    alternates=False,
                                    section_type=section[0])
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
