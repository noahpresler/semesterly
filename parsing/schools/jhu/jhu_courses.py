"""
JHU Course Parser.

@org      Semesterly
@author   Noah Presler & Michael Miller
@date     7/2/2017
"""

from __future__ import absolute_import, division, print_function

import re
import sys

from parsing.library.base_parser import CourseParser
from parsing.library.extractor import time_12to24, titlize


class HopkinsParser(CourseParser):
    """Hopkins course parser."""

    SCHOOL = 'jhu'
    API_URL = 'https://isis.jhu.edu/api/classes/'
    KEY = '***REMOVED***'
    DAY_TO_LETTER_MAP = {
        'm': 'M',
        't': 'T',
        'w': 'W',
        'th': 'R',
        'f': 'F',
        'sa': 'S',
        's': 'U'
    }

    def __init__(self, **kwargs):
        """Construct hopkins parser object."""
        self.schools = []
        self.last_course = {}
        super(HopkinsParser, self).__init__(HopkinsParser.SCHOOL, **kwargs)

    def _get_schools(self):
        url = '{}/codes/schools'.format(HopkinsParser.API_URL)
        params = {
            'key': HopkinsParser.KEY
        }
        self.schools = self.requester.get(url, params=params)

    def _get_courses(self, school):
        url = '{}/{}/{}'.format(HopkinsParser.API_URL,
                                school['Name'],
                                self.semester)
        params = {
            'key': HopkinsParser.KEY
        }
        return self.requester.get(url, params=params)

    def _get_section(self, course):
        return self.requester.get(self._get_section_url(course))

    def _get_section_url(self, course):
        return HopkinsParser.API_URL + '/' \
            + course['OfferingName'].replace(".", "") + course['SectionName'] \
            + '/' + self.semester + '?key=' + HopkinsParser.KEY

    def _parse_schools(self):
        for school in self.schools:
            self._parse_school(school)

    def _parse_school(self, school):
        courses = self._get_courses(school)
        for course in courses:
            section = self._get_section(course)
            if len(section) == 0:
                # FIXME - make this less hacky
                hacky_log_file = 'parsing/schools/jhu/logs/section_url_tracking.log'
                with open(hacky_log_file, 'w') as f:
                    print(self._get_section_url(course), file=f)
                continue
            self._load_ingestor(course, section)

    def _compute_size_enrollment(self, course):
        try:
            section_size = int(course['MaxSeats'])
        except:
            section_size = 0
        try:
            section_enrolment = section_size \
                - int(course['SeatsAvailable'].split("/")[0])
            if section_enrolment < 0:
                section_enrolment = 0
        except:
            section_enrolment = 0
        try:
            waitlist = int(course.get('Waitlisted', -1))
        except ValueError:
            waitlist = -1
        return (section_size, section_enrolment, waitlist)

    def _load_ingestor(self, course, section):
        section_details = section[0]['SectionDetails']
        try:
            num_credits = float(course['Credits'])
        except:
            num_credits = 0

        # Load core course fields
        self.ingestor['areas'] = filter(lambda a: a != "None",
                                        course['Areas'].split(','))
        if course['IsWritingIntensive'] == "Yes":
            self.ingestor['areas'] += ['Writing Intensive']

        if len(section_details[0]['Prerequisites']) > 0:
            prereqs = []
            for p in section_details[0]['Prerequisites']:
                prereqs.append(p['Description'])
            self.ingestor['prerequisites'] = ' '.join(prereqs)

        self.ingestor['level'] = re.findall(re.compile(r".+?\..+?\.(.{1}).+"),
                                            course['OfferingName'])[0] + "00"
        self.ingestor['name'] = titlize(course['Title'])
        self.ingestor['description'] = section_details[0]['Description']
        self.ingestor['code'] = course['OfferingName'].strip()
        self.ingestor['num_credits'] = num_credits
        self.ingestor['department_name'] = ' '.join(course['Department'].split()[1:])
        self.ingestor['campus'] = 1
        self.ingestor['exclusions'] = section_details[0].get('EnrollmentRestrictedTo')

        # Add specialty areas for computer science department
        if course['Department'] == 'EN Computer Science':
            cs_areas_re = r'\bApplications|\bAnalysis|\bSystems|\bGeneral'
            for match in re.findall(cs_areas_re, self.ingestor['description']):
                self.ingestor['areas'] += [match]

        created_course = self.ingestor.ingest_course()
        if self.last_course \
           and created_course['code'] == course['OfferingName'].strip() \
           and created_course['name'] != course['Title']:
            self.ingestor['section_name'] = course['OfferingName'].strip()
        self.last_course = created_course

        for meeting in section_details[0]['Meetings']:
            # Load core section fields
            self.ingestor['section'] = "(" + section[0]['SectionName'] + ")"
            self.ingestor['semester'] = self.semester.split()[0]
            self.ingestor['instrs'] = map(lambda i: i.strip(),
                                          course['Instructors'].split(','))
            self.ingestor['size'], self.ingestor['enrollment'], self.ingestor['waitlist'] = self._compute_size_enrollment(course)
            self.ingestor['year'] = self.semester.split()[1]

            created_section = self.ingestor.ingest_section(created_course)

            # Load offering fields.
            times = meeting['Times']
            for time in filter(lambda t: len(t) > 0, times.split(',')):
                time_pieces = re.search(r'(\d\d:\d\d [AP]M) - (\d\d:\d\d [AP]M)',
                                        time)
                self.ingestor['time_start'] = time_12to24(time_pieces.group(1))
                self.ingestor['time_end'] = time_12to24(time_pieces.group(2))
                if (len(meeting['DOW'].strip()) > 0 and
                        meeting['DOW'] != "TBA" and
                        meeting['DOW'] != "None"):
                    self.ingestor['days'] = map(
                        lambda d: HopkinsParser.DAY_TO_LETTER_MAP[d.lower()],
                        re.findall(r'([A-Z][a-z]*)+?', meeting['DOW'])
                    )
                    self.ingestor['location'] = {
                        'building': meeting['Building'],
                        'room': meeting['Room']
                    }
                    self.ingestor.ingest_meeting(created_section)

    def start(self,
              years=None,
              terms=None,
              departments=None,
              textbooks=True,
              verbosity=3,
              **kwargs):
        """Start parse."""
        self.verbosity = verbosity

        # Defualt to hardcoded current year.
        if not years:
            years = ['2017', '2016']
        if not terms:
            terms = ['Spring', 'Fall', 'Summer']

        # Run parser for all semesters specified.
        for year in years:
            for term in terms:
                self.semester = '{} {}'.format(term, year)
                self._get_schools()
                self._parse_schools()
