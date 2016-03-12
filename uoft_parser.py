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
        self.host = 'http://coursefinder.utoronto.ca/course-search/search'
        self.urls = None
        self.cookies = cookielib.CookieJar()
        self.s = requests.Session()
        self.courses = None
        self.count = 0
        self.total = 0

    def get_school_name(self):
        return self.school

    def start(self):
        """Update the local JSON files for this scraper."""

        # CourseOffering.objects.all().delete()
        # Course.objects.all().delete()
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

                try:
                    try:
                        course = Course.objects.get(code=code)
                    except:
                        course = Course(code=code, 
                                        name=data['name'], 
                                        description=data['description'],
                                        campus=code[-1],
                                        breadths=data['breadths'],
                                        prerequisites=data['prerequisites'],
                                        exclusions=data['exclusions'])
                        course.save()

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
                                prev = CourseOffering.objects.filter(course=course, 
                                                semester=data['code'][-1],
                                                meeting_section=section['code'],
                                                day=day,
                                                time_start=time['start'],
                                                )[0]
                                dups += 1
                                print "Found a duplicate entry for", data['code'], ". Moving on..."
                                continue
                            except:
                                try:
                                    co = CourseOffering(course=course, 
                                                        semester=data['code'][-1],
                                                        meeting_section=section['code'],
                                                        instructors=instructors,
                                                        day=day,
                                                        time_start=time['start'],
                                                        time_end=time['end'],
                                                        location=time['location'],
                                                        size=section['size'],
                                                        enrolment=section['enrolment'],
                                                        alternates=section['alternates'],
                                                        section_type=section['code'][0])
                                    co.save()
                                    off_count += 1
                                except Exception as e:
                                    print "Error while trying to store", data['code'], ":"
                                    print e
                                    continue

                    print "Finished with #%d, %s" % (self.count, data['code'])
                    self.count += 1
                except Exception as f:
                    print "Something went wrong with", data['code'], ":"
                    print f
        print "Done!"
        print "Finished all! Found %d total courses, %d total offerings and %d duplicate offerings." % (self.count, off_count, dups)

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

        self.total = len(json['aaData'])

        return json['aaData']

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

        # campus = soup.find(id="u149").find_all("span", id="u149")[0] \
        #     .get_text().strip()

        # if campus == "St. George":
        #     campus = "UTSG"
        # elif campus == "Mississauga":
        #     campus = "UTM"
        # elif campus == "Scarborough":
        #     campus = "UTSC"

        # term = soup.find(id="u158").find_all("span", id="u158")[0] \
        #     .get_text().strip()

        # # Things that don't appear on all courses

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

        # basic_course = OrderedDict([
        #     ("code", course_code),
        #     ("name", course_name),
        #     ("description", description),
        #     ("division", division),
        #     ("department", department),
        #     ("prerequisites", prereq),
        #     ("exclusions", exclusions),
        #     ("level", course_level),
        #     ("campus", campus),
        #     ("breadths", breadths)
        # ])

        # return [course, basic_course]
        return course


if __name__ == "__main__":
    parser = UofTParser()
    parser.start()
