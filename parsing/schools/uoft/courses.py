# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from parsing.library.base_parser import BaseParser
import requests, http.cookiejar
# import http.cookiejar
from bs4 import BeautifulSoup
from collections import OrderedDict
import time
import re
import json
import os
import sys
import django
import datetime
from html.parser import HTMLParser
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def remove_html_tags(text):
    s = MLStripper()
    s.feed(text)
    return s.get_data()


class Parser(BaseParser):
    """A scraper for UofT's Course Finder web service.
    Course Finder is located at http://coursefinder.utoronto.ca/.
    """

    def __init__(self, **kwargs):
        self.school = "uoft"
        self.cookies = http.cookiejar.CookieJar()
        self.s = requests.Session()
        self.years_of_study = ["1", "2", "3", "4"]
        self.level_map = {"1": "100", "2": "200", "3": "300", "4": "400"}
        self.day_map = {'MO': 'M', 'TU': 'T', 'WE': 'W', 'TH': 'R', 'FR': 'F', None: ''}
        self.errors = 0
        self.host = 'http://coursefinder.utoronto.ca/course-search/search'
        self.urls = None
        self.cookies = http.cookiejar.CookieJar()
        self.s = requests.Session()
        self.new = 0
        super(Parser, self).__init__('uoft', **kwargs)

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

    def start_engineering(self):
        engineering_day_map = {"Mon": "M", "Tue": "T", "Wed": "W", "Thu": "T", "Fri": "F"}
        try:
            for semester in ["fall", "winter"]:
                print("Parsing " + semester + " for engineering")
                json = {}
                print("Making request, will update when response received...")
                request_url = "http://www.apsc.utoronto.ca/timetable/{}.html".format(semester)
                soup = BeautifulSoup(self.s.get(url=request_url, cookies=self.cookies, timeout=15).text)
                print("Response received. Initiating parse of response HTML.")
                tables = soup.find_all('table',attrs={"border": "border"})
                data = []
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        cols = row.find_all('td')
                        cols = [ele.text.strip() for ele in cols]
                        split_row = [ele for ele in cols if ele] # Get rid of empty values
                        if not split_row: continue
                        assert len(split_row) == 9
                        course, section, _, day, start, end, loc, profs, __ = split_row
                        if day not in engineering_day_map: continue
                        course = course.strip()
                        section = section.strip()
                        section = section[0] + section[3:]
                        print("On", course + ", section " + section + "...")
                        if course not in json:
                            json[course] = {}
                        if section not in json[course]:
                            json[course][section] = {'profs': profs.strip().replace("&nbsp", "").replace(";", ""), 'offerings': []}

                        json[course][section]['offerings'].append({
                            'day': engineering_day_map[day],
                            'time_start': start.strip(),
                            'time_end': end.strip(),
                            'location': loc.strip(),
                        })

                for course in json:
                    code = course[:-1]
                    C, created = Course.objects.update_or_create(school="uoft", code=code,defaults={
                            'campus': code[-1],
                            'num_credits': 1 if code[6].upper() == 'Y' else 0.5,
                            'level': code[3] + "00",
                            'department': code[:3]
                        })
                    C.save()
                    if created:
                        self.new += 1
                    for section in json[course]:
                        S, created = Section.objects.update_or_create(
                            course=C,
                            meeting_section=section,
                            section_type=section[0],
                            semester=course[-1],
                            defaults={
                                'instructors': json[course][section]['profs'],
                        })
                        S.save()
                        S.offering_set.all().delete()
                        S.save()
                        for offering_dict in json[course][section]['offerings']:
                            o, created = Offering.objects.update_or_create(section=S,
                                day=offering_dict['day'],
                                time_start=offering_dict['time_start'],
                                time_end=offering_dict['time_end'],
                                defaults={
                                    'location': offering_dict['location']
                                })
                            o.save()

            print("Done Engineering, found %d new courses (collectively) so far. Now wrapping up..." % (self.new))
        except requests.ConnectionError:
            print("Couldn't connect. Found %d new courses (collectively) so far. Now wrapping up..." % (self.new))
        self.wrap_up()


    def start(self, **kwargs):
        print("Starting St. George.")
        for year_of_study in self.years_of_study:
            level = self.level_map[year_of_study]
            print("Parsing year: {}".format(year_of_study))
            request_url = "https://timetable.iit.artsci.utoronto.ca/api/courses?org=&code=&section=&studyyear={}&daytime=&weekday=&prof=&breadth=".format(year_of_study)
            data = json.loads(self.s.get(url=request_url, cookies=self.cookies).text)
            for key in data:
                try:

                    course_data = data[key]
                    course_code = course_data['code']
                    num_credits = 1 if course_code[6].upper() == 'Y' else 0.5

                    C, created = Course.objects.update_or_create(code=course_code, defaults={
                            'school': "uoft",
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
                    print("Course:", C, "New?:", created)
                    if created:
                        self.new += 1
                    meetings = course_data['meetings']
                    semester = course_data['section']

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
                        size = section_data['enrollmentCapacity'] if section_data['enrollmentCapacity'] else 0
                        S, s_created = Section.objects.update_or_create(
                            course=C,
                            meeting_section=section,
                            section_type=section[0],
                            semester=semester,
                            defaults={
                                'instructors': instructors,
                                'size': size,
                                'enrolment': 0,
                        })
                        S.save()
                        S.offering_set.all().delete()
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
                                S.delete()
                                print(e)
                                self.errors += 1
                                break
                except Exception as f:
                    import traceback
                    traceback.print_exc()

        print("Total errors:", self.errors)
        print("Done St. George, found %d new courses. Now starting UTM." % (self.new))
        self.start_utm()

    def start_utm(self):

        print("Parsing UTM")
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
            soup = BeautifulSoup(response)
            level = self.level_map[year_of_study]
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

                C, created = Course.objects.update_or_create(school="uoft", code=code, defaults={
                    'name': name,
                    'description': remove_html_tags(description),
                    'campus': code[-1],
                    'prerequisites': prerequisites,
                    'exclusions': exclusions,
                    'num_credits': num_credits,
                    'level': level,
                    'department': code[:3],
                })
                print("Course:", C, "New?:", created)
                if created:
                    self.new += 1
                section_data = []
                section_data_table = course_div.find('table')
                tbody = section_data_table.find('tbody')
                rows = tbody.find_all('tr')
                for section in rows:
                    cols = section.find_all('td')
                    cols = [ele.text.strip() for ele in cols]
                    section_data.append([ele for ele in cols])

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
                        print("Failed on:",code, "Locations:",locations, "Days:",days, "Section:",section)
                    assert len(days) == len(start_times) == len(end_times) == len(locations)
                    print("\t\tSection:", section)
                    S, s_created = Section.objects.update_or_create(
                        course=C,
                        meeting_section=section,
                        section_type=section[0],
                        semester=semester,
                        defaults={
                            'instructors': instructors,
                            'size': size,
                            'enrolment': int(enrolment),
                            'waitlist': int(waitlist)
                    })
                    S.save()
                    S.offering_set.all().delete()
                    for o in range(len(days)):
                        day, start, end, loc = days[o], start_times[o], end_times[o], locations[o]
                        if day not in self.day_map:
                            print("==============ERROR: Day", day, " is not valid!==============")
                            continue
                        CO, co_created = Offering.objects.update_or_create(section=S,
                                day=self.day_map[day],
                                time_start=start,
                                time_end=end,
                                location=loc)

                        CO.save()

                        print("\t\t\t", day, start, end, loc)
        print("Done UTM, found %d new courses (collectively) so far. Now starting UTSC." % (self.new))
        self.start_utsc()

    def remove_intermediary_spaces(self, text):
        return ' '.join(text.split())
    def get_section_info(self, tds):
        return {
      'meeting_section': self.remove_intermediary_spaces(tds[0].text),
      'day': self.remove_intermediary_spaces(tds[1].text),
      'time_start': self.remove_intermediary_spaces(tds[2].text),
      'time_end': self.remove_intermediary_spaces(tds[3].text),
      'location': self.remove_intermediary_spaces(tds[4].text),
      'instructors': self.remove_intermediary_spaces(tds[5].text),
      'notes': self.remove_intermediary_spaces(tds[6].text)
    }
    def get_excl_prereq_breadth(self, tag):
       excl_prereq_breadth = {
          'exclusions': '',
          'prerequisites': '',
          'breadth': ''
       }
       while tag and tag.name != 'a':

          if 'Exclusion' not in tag and 'Prerequisite' not in tag and 'Breadth' not in tag:
             tag = tag.nextSibling
             continue
          is_excl = 'Exclusion' in tag
          is_prereq = 'Prerequisite' in tag
          is_breadth = 'Breadth' in tag

          value = tag[tag.index(":") + 1: ].strip()
          while tag.nextSibling and tag.nextSibling.name != "a" and ":" not in tag.nextSibling:
             try:
                value += tag.nextSibling
             except:
                value += tag.nextSibling.get_text()
             tag = tag.nextSibling

          value = self.remove_intermediary_spaces(value)
          if is_excl:
             excl_prereq_breadth['exclusions'] = value
          elif is_prereq:
             excl_prereq_breadth['prerequisites'] = value
          elif is_breadth:
             excl_prereq_breadth['breadth'] = value
          tag = tag.nextSibling
       return excl_prereq_breadth

    def get_course_details(self, code, link):
       try:
         desc, excl, prereq, breadth = '', '', '', ''
         detail_soup = BeautifulSoup(self.s.get(link).text)
         [br.extract() for br in detail_soup.find_all('br')]
         for anc in detail_soup.find_all('a'):
            if not anc.has_attr('name'):
               anc.replaceWith(anc.get_text())

         a = detail_soup.find('a', {'name':code})
         alternate_desc = False

         try:
            if a.next_sibling.next_sibling.strip or a.next_sibling.next_sibling.text.strip():
              desc = a.next_sibling.next_sibling
            else:
              alternate_desc = True
              desc = a.find_next('span', {'style': 'mso-bidi-font-size: 12.0pt;'})

         except Exception as e:
            desc = a.find_next('p')

         if "CITD05" in code or "CITD06" in code:
          desc_text = "Unavailable"
         else:
          desc_text = desc.get_text().strip()

         assert len(desc_text) > 2


         if not alternate_desc:
            excl_or_prereq = desc.nextSibling
         else:
            excl_or_prereq = desc.parent.nextSibling

         result = self.get_excl_prereq_breadth(excl_or_prereq)
         result ['description'] = self.remove_intermediary_spaces(desc_text).strip()

         return result
       except:
        print("\tError: Couldn't find desc/excl/prereq/breadth details for", code)
        return {
          'description': '',
          'exclusions': '',
          'prerequisites': '',
          'breadth': ''
       }


    def is_tr_relevant(self, tr):
       if tr.has_attr('style') and "rgb(231, 234, 239)" not in tr.get('style'):
          return False
       return True

    def is_tr_new_course(self, tr):
        return tr.find('b') and tr.find('b').find('a')
    def start_utsc(self):
        payload = {
            'sess': 'year',
            'course': 'DISPLAY_ALL',
            'submit': 'Display+by+Discipline',
            'course2': '',
        }
        response = self.s.post(url="http://www.utsc.utoronto.ca/~registrar/scheduling/timetable", data=payload).text

        soup = BeautifulSoup(response)
        table = soup.find("table", class_="tb_border_tb")
        trs = list(filter(self.is_tr_relevant, table.find_all('tr')))
        i = 0
        utsc_level_map = {"A": "100", "B": "200", "C": "300", "D": "400"}
        while i < len(trs):
            tr = trs[i]
            if self.is_tr_new_course(tr):
              code_and_semester = tr.find('a').text.strip()
              code = code_and_semester[:-1]
              semester = code_and_semester[-1]
              course_link = tr.find('a').get('href')
              tr.a.extract()
              name = tr.find('b').text.strip()[2:]
              level = code[3].upper()
              assert level in ["A", "B", "C", "D"]
              print("On Course:", code, ":", name, "\n")
              course_details = self.get_course_details(code, course_link)
              C, created = Course.objects.update_or_create(code=code, school="uoft", defaults={
                    'name': name,
                    'description': course_details['description'],
                    'campus': code[-1],
                    'areas': '',
                    'prerequisites': course_details['prerequisites'],
                    'exclusions': course_details['exclusions'],
                    'num_credits': 1 if code[6].upper() == 'Y' else 0.5,
                    'level': level,
                    'department': code[:3]
              })
              if created:
                self.new += 1


            else: #sections and offerings
              tds = tr.find_all('td')
              assert len(tds) == 7
              section_info = self.get_section_info(tds)
              if section_info['meeting_section']:
                 meeting_section = section_info['meeting_section'][0] + section_info['meeting_section'][3:]

              if section_info['time_start'] == '' or section_info['time_end'] == '':
                 print("\tInvalid details for course", code, section_info['meeting_section'], ". Perhaps online?\n")
                 i += 1
                 continue

              instructors = section_info['instructors']
              S, s_created = Section.objects.update_or_create(
                    course=C,
                    meeting_section=meeting_section,
                    section_type=meeting_section[0],
                    semester=semester,
                    defaults={
                        'instructors': instructors,
                        'enrolment': 0,
              })
              CO, co_created = Offering.objects.update_or_create(section=S,
                                    day=self.day_map[section_info['day']],
                                    time_start=section_info['time_start'].strip(),
                                    time_end=section_info['time_end'].strip(),
                                    defaults={
                                      'location': section_info['location']
                                    })

              CO.save()
              print("\t", meeting_section, "taught by", instructors)
              print("\t\t", section_info['day'] + ":", section_info['time_start'] + "-" + section_info['time_end'], "at", section_info['location'])

            i += 1
        print("Done UTSC, found %d new courses (collectively) so far. Now starting Engineering." % (self.new))
        self.start_engineering()

    def wrap_up(self):
        print("Done! Total new courses found:", self.new)

        update_object, created = Updates.objects.update_or_create(
            school=self.school,
            update_field="Course",
            defaults={'last_updated': datetime.datetime.now()}
        )
        update_object.save()
