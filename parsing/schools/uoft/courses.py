from parsing.library.base_parser import BaseParser
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
import datetime
from HTMLParser import HTMLParser

from parsing.library.validator import ValidationError

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
        self.cookies = cookielib.CookieJar()
        self.s = requests.Session()
        self.years_of_study = ["1", "2", "3", "4"]
        self.level_map = {"1": "100", "2": "200", "3": "300", "4": "400"}
        self.day_map = {'MO': 'M', 'TU': 'T', 'WE': 'W', 'TH': 'R', 'FR': 'F', None: ''}
        self.term_map = {'Fall': 'F', 'Winter': 'S'}
        self.credit_map = {'F': 0.5, 'S': 0.5, 'Y': 1.0}
        self.errors = 0
        self.host = 'http://coursefinder.utoronto.ca/course-search/search'
        self.urls = None
        self.cookies = cookielib.CookieJar()
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
                print "Parsing " + semester + " for engineering"
                json = {}
                print "Making request, will update when response received..."
                request_url = "http://www.apsc.utoronto.ca/timetable/{}.html".format(semester)
                soup = BeautifulSoup(self.s.get(url=request_url, cookies=self.cookies, timeout=15).text)
                print "Response received. Initiating parse of response HTML."
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
                        print "On", course + ", section " + section + "..."
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

            print "Done Engineering, found %d new courses (collectively) so far. Now wrapping up..." % (self.new)
        except requests.ConnectionError:
            print "Couldn't connect. Found %d new courses (collectively) so far. Now wrapping up..." % (self.new)
        self.wrap_up()

    def start(self, **kwargs):
        try:
            self.start_utsg(**kwargs)
        except:
            print('UTSG failed.')

        try:
            self.start_utm()
        except:
            print('UTM failed.')

        try:
            self.start_utsc()
        except:
            print('UTSC failed.')

        try:
            self.start_engineering()
        except:
            print('Engineering failed.')

    def start_utsg(self, **kwargs):
        print('Starting St. George.')

        for school_year in [2016, 2017, 2018]:
            for term in ['Fall', 'Winter']:  # First (Fall), Second (Winter)

                url = "https://timetable.iit.artsci.utoronto.ca/api/{}9/courses?section={},Y"\
                    .format(school_year, self.term_map[term])
                data = json.loads(self.s.get(url=url, cookies=self.cookies).text)

                for course_key in data:
                    course_data = data[course_key]
                    self.ingestor['school'] = 'uoft'
                    self.ingestor['course_code'] = course_data.get('code')
                    self.ingestor['course_name'] = course_data.get('courseTitle')
                    self.ingestor['department_name'] = course_data.get('orgName')
                    self.ingestor['department_code'] = course_data.get('org')
                    self.ingestor['campus'] = 'St. George'
                    self.ingestor['areas'] = course_data.get('breadthCategories')
                    self.ingestor['prerequisites'] = course_data.get('prerequisite')
                    self.ingestor['exclusions'] = course_data.get('exclusion')
                    self.ingestor['num_credits'] = self.credit_map.get(course_data.get('section'))
                    self.ingestor['level'] = self.level_map.get(course_data.get('code', '    ')[3])
                    self.ingestor['description'] = BeautifulSoup(course_data.get('courseDescription', '')).get_text()
                    course = self.ingestor.ingest_course()

                    for section_key in course_data.get('meetings', ''):
                        section_data = course_data['meetings'][section_key]
                        self.ingestor['section_code'] = section_data.get('teachingMethod', '') + section_data.get('sectionNumber', '')
                        self.ingestor['section_type'] = section_data.get('teachingMethod')
                        self.ingestor['term'] = term
                        self.ingestor['year'] = school_year + (1 if term == 'Winter' else 0)
                        self.ingestor['instructors'] = ', '.join('{} {}'.format(
                            section_data['instructors'][i].get('firstName', '').encode('utf-8'),
                            section_data['instructors'][i].get('lastName', '').encode('utf-8'))
                                                                 for i in section_data.get('instructors', ''))
                        self.ingestor['capacity'] = section_data.get('enrollmentCapacity', 0)
                        self.ingestor['enrollment'] = section_data.get('actualEnrolment', 0)
                        self.ingestor['waitlist'] = section_data.get('actualWaitlist', 0)
                        section = self.ingestor.ingest_section(course)

                        for meeting_key in section_data.get('schedule', ''):
                            meeting_data = section_data['schedule'][meeting_key]
                            self.ingestor['day'] = self.day_map.get(meeting_data['meetingDay'])
                            self.ingestor['start_time'] = meeting_data.get('meetingStartTime')
                            self.ingestor['end_time'] = meeting_data.get('meetingEndTime')
                            self.ingestor['location'] = meeting_data.get('assignedRoom' + '1' if term == 'Fall' else '2')
                            try:
                                self.ingestor.ingest_meeting(section)
                            except ValidationError:
                                pass

        print('Done St. George.')

    def start_utm(self):

        print "Parsing UTM"
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
                print "Course:", C, "New?:", created
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
                        print "Failed on:",code, "Locations:",locations, "Days:",days, "Section:",section
                    assert len(days) == len(start_times) == len(end_times) == len(locations)
                    print "\t\tSection:", section
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
                    for o in xrange(len(days)):
                        day, start, end, loc = days[o], start_times[o], end_times[o], locations[o]
                        if day not in self.day_map:
                            print "==============ERROR: Day", day, " is not valid!=============="
                            continue
                        CO, co_created = Offering.objects.update_or_create(section=S,
                                day=self.day_map[day],
                                time_start=start,
                                time_end=end,
                                location=loc)

                        CO.save()

                        print "\t\t\t", day, start, end, loc
        print "Done UTM, found %d new courses (collectively) so far." % (self.new)

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
        print "\tError: Couldn't find desc/excl/prereq/breadth details for", code
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
        print('Starting UTSC.')

        payload = {
            'sess': 'year',
            'course': 'DISPLAY_ALL',
            'submit': 'Display+by+Discipline',
            'course2': '',
        }
        response = self.s.post(url="http://www.utsc.utoronto.ca/~registrar/scheduling/timetable", data=payload).text

        soup = BeautifulSoup(response)
        table = soup.find("table", class_="tb_border_tb")
        trs = filter(self.is_tr_relevant, table.find_all('tr'))
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
              print "On Course:", code, ":", name, "\n"
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
                 print "\tInvalid details for course", code, section_info['meeting_section'], ". Perhaps online?\n"
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
              print "\t", meeting_section, "taught by", instructors
              print "\t\t", section_info['day'] + ":", section_info['time_start'] + "-" + section_info['time_end'], "at", section_info['location']

            i += 1
        print "Done UTSC, found %d new courses (collectively) so far." % (self.new)

    def wrap_up(self):
        print "Done! Total new courses found:", self.new

        update_object, created = Updates.objects.update_or_create(
            school=self.school,
            update_field="Course",
            defaults={'last_updated': datetime.datetime.now()}
        )
        update_object.save()
