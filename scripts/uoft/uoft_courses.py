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
            f = open('example.html', 'w')
            f.write(response)
            f.close()
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

                C, created = Course.objects.update_or_create(code=code, defaults={
                    'name': name,
                    'description': description,
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
                # C.courseoffering_set.all().delete()
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
                        if day not in self.day_map:
                            print "==============ERROR: Day", day, " is not valid!=============="
                            continue
                        CO, co_created = CourseOffering.objects.update_or_create(course=C, 
                            semester=semester,
                            meeting_section=section,
                            day=self.day_map[day],
                            time_start=start,
                            time_end=end,
                            section_type=section_type, defaults={
                            'instructors': instructors,
                            'location': loc,
                            'size': size,
                            'enrolment': enrolment,
                            'alternates': False,
                        })
                        CO.save()
                        print "\t\t\t", day, start, end, loc
        self.start_coursefinder()


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
                                CO, co_created = CourseOffering.objects.update_or_create(course=C,
                                    semester=semester,
                                    meeting_section=section,
                                    day=self.day_map[offering_data['meetingDay']],
                                    time_start=offering_data['meetingStartTime'],
                                    time_end=offering_data['meetingEndTime'],
                                    section_type=section[0], defaults={
                                    'instructors': instructors,
                                    'location': '',
                                    'size': section_data['enrollmentCapacity'],
                                    'enrolment': 0,
                                    'alternates': False,
                                })
                                           
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

    def get_course_html(self, url):
        """Update the locally stored course pages."""

        html = None
        while html is None:
            try:
                r = self.s.get(url, cookies=self.cookies)
                if r.status_code == 200:
                    html = r.text
            except (requests.exceptions.Timeout,
                    requests.exceptions.ConnectionError):
                continue

        return html.encode('utf-8')
    def search(self, query='', requirements=''):
        """Perform a search and return the data as a dict."""

        url = '%s/courseSearch/course/search' % self.host

        data = {
            'queryText': query,
            'requirements': requirements,
            'campusParam': 'St. George,Scarborough,Mississauga'
        }

        # Keep trying to get data until a proper response is given
        json = None
        while json is None:
            try:
                r = self.s.get(url, params=data, cookies=self.cookies)
                if r.status_code == 200:
                    json = r.json()
                else:
                    time.sleep(0.5)
            except requests.exceptions.Timeout:
                continue

        # self.total = len(json['aaData'])

        return json['aaData']
    def parse_course_html(self, course_id, html):
        """Create JSON files from the HTML pages downloaded."""

        if "The course you are trying to access does not exist" in \
                html.decode('utf-8'):
            return False

        soup = BeautifulSoup(html)

        # Things that appear on all courses

        title = soup.find(id="u19")
        title_name = title.find_all("span",
                                    class_="uif-headerText-span")[0].get_text()

        course_code = course_id[:-5]

        course_name = title_name[10:]

        # division = soup.find(id="u23").find_all("span", id="u23")[0] \
        #     .get_text().strip()

        description = soup.find(id="u32").find_all("span", id="u32")[0] \
            .get_text().strip()

        # department = soup.find(id="u41").find_all("span", id="u41")[0] \
        #     .get_text().strip()

        course_level = soup.find(id="u86").find_all("span", id="u86")[0] \
            .get_text().strip()
        course_level = course_level[:3]
        course_level = int(course_level)


        as_breadth = soup.find(id="u122")
        breadths = ''
        if as_breadth is not None:
            as_breadth = as_breadth.find_all("span", id="u122")[0] \
                .get_text().strip()
            for ch in as_breadth:
                if ch in "12345":
                    breadths = breadths + ch

        exclusions = soup.find(id="u68")
        if exclusions is not None:
            exclusions = exclusions.find_all("span", id="u68")[0] \
                .get_text().strip()
        else:
            exclusions = ""

        prereq = soup.find(id="u50")
        if prereq is not None:
            prereq = prereq.find_all("span", id="u50")[0].get_text().strip()
        else:
            prereq = ""

        # Meeting Sections

        meeting_table = soup.find(id="u172")

        trs = []
        if meeting_table is not None:
            trs = meeting_table.find_all("tr")

        sections = []
        for tr in trs:
            tds = tr.find_all("td")
            if len(tds) > 0:
                code = tds[0].get_text().strip()

                alternates = True if 'Alternate week' in tds[1].get_text() else False
                raw_times = tds[1].get_text().replace(
                    'Alternate week', '').strip().split(" ")
                times = []
                for i in range(0, len(raw_times) - 1, 2):
                    times.append(raw_times[i] + " " + raw_times[i + 1])

                instructors = BeautifulSoup(str(tds[2]).replace("<br>", "\n"))
                instructors = instructors.get_text().split("\n")
                instructors = \
                    list(filter(None, [x.strip() for x in instructors]))

                raw_locations = tds[3].get_text().strip().split(" ")
                locations = []
                for i in range(0, len(raw_locations) - 1, 2):
                    locations.append(
                        raw_locations[i] + " " + raw_locations[i + 1])

                class_size = tds[4].get_text().strip()
                current_enrolment = tds[5].get_text().strip()

                time_data = []
                for i in range(len(times)):
                    info = times[i].split(" ")
                    day = info[0]
                    hours = info[1].split("-")

                    location = ""
                    try:
                        location = locations[i]
                    except IndexError:
                        location = ""

                    for i in range(len(hours)):
                        x = hours[i].split(':')
                        hours[i] = int(x[0]) + (int(x[1])/60)

                    time_data.append(OrderedDict([
                        ("day", day),
                        ("start", hours[0]),
                        ("end", hours[1]),
                        ("duration", hours[1] - hours[0]),
                        ("location", location)
                    ]))

                code = code.split(" ")
                code = code[0][0] + code[1]

                data = OrderedDict([
                    ("code", code),
                    ("instructors", instructors),
                    ("times", time_data),
                    ("size", int(class_size)),
                    ("enrolment", int(current_enrolment) if current_enrolment else 0),
                    ('alternates', alternates)
                ])

                sections.append(data)

        # Dictionary creation
        course = OrderedDict([
            ("id", course_id),
            ("code", course_code),
            ("name", course_name),
            ("description", description),
            # ("division", division),
            # ("department", department),
            ("prerequisites", prereq),
            ("exclusions", exclusions),
            # ("level", course_level),
            # ("campus", campus),
            # ("term", term),
            ("breadths", breadths),
            ("meeting_sections", sections)
        ])

        return course
    def start_coursefinder(self):
        print "Now starting coursefinder."

        dups = 0
        off_count = 0

        os.chdir(os.path.dirname(os.path.abspath(__file__)))

        urls = self.search()
        for x in urls:
            course_id = re.search('offImg(.*)', x[0]).group(1)[:14]
            summer = course_id[-1] == '5' # summer course if starts in may
            code = course_id[:8]
            url = '%s/courseSearch/coursedetails/%s' % (self.host, course_id)
            html = self.get_course_html(url) if not summer else None
            # with open('html/%s.html' % course_id, 'w+') as outfile:
            #    outfile.write(html.decode('utf-8'))
            data = self.parse_course_html(course_id, html) if not summer else None
            if data:
                if summer:
                    print "=====SUMMER COURSE PARSING!!======"
                num_credits = 1 if code[6].upper() == 'Y' else 0.5
                level = self.level_map[code[3]]

                try:
                    C, created = Course.objects.update_or_create(code=code, defaults={
                        'name': data['name'],
                        'description': data['description'],
                        'campus': code[-1],
                        'prerequisites': data['prerequisites'],
                        'exclusions': data['exclusions'],
                        'num_credits': num_credits,
                        'level': level,
                        'areas': data['breadths'],
                        'department': code[:3],
                    })
                    if created:
                        self.new += 1
                    C.save()

                    print "Course:", C, "New?:", created
                    if C.areas:
                        print "Coursefinder found area!:", C.areas

                    if not created:
                        print "Not new! moving on..."
                        continue
                    day_to_letter_map = {'monday': 'M', 
                                        'tuesday': 'T', 
                                        'wednesday': 'W',
                                        'thursday': 'R',
                                        'friday': 'F'}
                    for section in data['meeting_sections']:
                        instructors = ', '.join(map(lambda s: s if s == 'TBA' else s[0] + '.' + s[1:], section['instructors']))
                        times = section['times']
                        for time in times:
                            day = day_to_letter_map[time['day'].lower()]
                            if ":" not in str(time['start']):
                                time['start'] = str(time['start']) + ":00"
                            if ":" not in str(time['end']):
                                time['end'] = str(time['end']) + ":00"
                            
                            try:
                                CO, co_created = CourseOffering.objects.update_or_create(                course=C, 
                                                    semester=data['code'][-1],
                                                    meeting_section=section['code'],
                                                    day=day,
                                                    time_start=time['start'],
                                                    time_end=time['end'],
                                                    location=time['location'],
                                                    section_type=section['code'][0],
                                                    defaults={
                                                    'instructors':instructors,
                                                    'enrolment': section['enrolment'],
                                                    'alternates': section['alternates'],
                                                })
                                CO.save()
                                print "\t\t", section['code']
                                print "\t\t\t", day, time['start'], "-", time['end']

                                off_count += 1
                            except Exception as e:
                                print "Error while trying to store", data['code'], ":"
                                print e
                                continue

                except Exception as f:
                    print "Something went wrong with", data['code'], ":"
                    print f
        print "Done. Found {} new courses".format(self.new)

if __name__ == "__main__":
    parser = UofTParser()
    parser.start()
