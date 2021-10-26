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

import logging
import re

from parsing.library.base_parser import BaseParser
from parsing.library.utils import dict_filter_by_dict
from semesterly.settings import get_secret


class Parser(BaseParser):
    """Hopkins course parser.

    Attributes:
        API_URL (str): Description
        DAY_MAP (TYPE): Description
        KEY (str): Description
        last_course (dict): Description
        schools (list): Description
        semester (TYPE): Description
        verbosity (TYPE): Description
    """

    API_URL = 'https://sis.jhu.edu/api/classes/'
    DAY_MAP = {
        'm': 'M',
        't': 'T',
        'w': 'W',
        'th': 'R',
        'f': 'F',
        'sa': 'S',
        's': 'U'
    }

    def __new__(cls, *args, **kwargs):
        """Set static variables within closure.

        Returns:
            Parser
        """
        new_instance = object.__new__(cls)
        cls.KEY = get_secret('JHU_API_KEY')
        return new_instance

    def __init__(self, **kwargs):
        """Construct hopkins parser object."""
        self.schools = []
        self.last_course = {}
        super(Parser, self).__init__('jhu', **kwargs)

    def _get_schools(self):
        self.schools = self.requester.get(
            Parser.API_URL + '/codes/schools',
            params={'key': Parser.KEY}
        )

    def _get_courses(self, school):
        url = '{}/{}/{}'.format(Parser.API_URL,
                                school['Name'],
                                self.semester)
        return self.requester.get(url, params={'key': Parser.KEY})

    def _get_section(self, course):
        return self.requester.get(self._get_section_url(course))

    def _get_section_url(self, course):
        return Parser.API_URL + '/' \
            + course['OfferingName'].replace(".", "") + course['SectionName'] \
            + '/' + self.semester + '?key=' + Parser.KEY

    def _parse_schools(self):
        for school in self.schools:
            self._parse_school(school)

    def _parse_school(self, school):
        courses = self._get_courses(school)
        for course in courses:
            section = self._get_section(course)
            if len(section) == 0:
                logging.warn(self._get_section_url(course))
                continue
            self._load_ingestor(school['Name'], course, section)

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
            waitlist = int(course.get('Waitlisted'))
        except ValueError:
            waitlist = None
        return (section_size, section_enrolment, waitlist)

    def _load_ingestor(self, school, course, section):
        self.ingestor['sub_school'] = school
        self.ingestor['course_section_id'] = section[0]['SSS_SectionsID']
        section_details = section[0]['SectionDetails']
        try:
            num_credits = float(course['Credits'])
        except:
            num_credits = 0


        areas = []
        if school == "Krieger School of Arts and Sciences" or school == "Whiting School of Engineering":
            if course['Areas'] != "None":
                for letter in course['Areas']:
                    areas.append(letter)
            # Add specialty areas for computer science department
            #if course['Department'] == 'EN Computer Science':
            #    cs_areas_re = r'\bApplications|\bAnalysis|\bSystems|\bGeneral'
            #    for match in re.findall(cs_areas_re, self.ingestor['description']):
            #        areas.append(match.encode('ascii', 'ignore'))
        self.ingestor['areas'] = areas

        self.ingestor['writing_intensive'] = course['IsWritingIntensive']

        if len(section_details[0]['Prerequisites']) > 0:
            prereqs = []
            for p in section_details[0]['Prerequisites']:
                prereqs.append(p['Description'])
            self.ingestor['prerequisites'] = ' '.join(prereqs)
        else:
            self.ingestor['prerequisites'] = ''

        self.ingestor['level'] = re.findall(re.compile(r".+?\..+?\.(.{1}).+"),
                                            course['OfferingName'])[0] + "00"
        self.ingestor['name'] = course['Title']
        self.ingestor['description'] = section_details[0]['Description']
        self.ingestor['code'] = course['OfferingName'].strip()
        self.ingestor['num_credits'] = num_credits
        self.ingestor['department_name'] = ' '.join(
            course['Department'].split()[1:]
        )
        self.ingestor['campus'] = 1
        self.ingestor['exclusions'] = section_details[0].get(
            'EnrollmentRestrictedTo'
        )

        tags = [];
        for tag in section_details[0]['PosTags']:
            tags.append(tag['Tag'])
        self.ingestor['pos']=tags

        created_course = self.ingestor.ingest_course()
        if self.last_course \
           and created_course['code'] == course['OfferingName'].strip() \
           and created_course['name'] != course['Title']:
            self.ingestor['section_name'] = course['OfferingName'].strip()
        self.last_course = created_course

        for meeting in section_details[0]['Meetings']:
            # Load core section fields
            self.ingestor['section'] = "(" + section[0]['SectionName'] + ")"
            self.ingestor['instrs'] = [i.strip() for i in course['Instructors'].split(',')]

            size, enrollment, waitlist = self._compute_size_enrollment(course)
            self.ingestor['size'] = size
            self.ingestor['enrollment'] = enrollment
            self.ingestor['waitlist'] = waitlist

            created_section = self.ingestor.ingest_section(created_course)

            # Load offering fields.
            dates = meeting['Dates'].split(' to ')
            self.ingestor['date_start'] = dates[0]
            self.ingestor['date_end'] = dates[1]
            

            times = meeting['Times']
            for time in [t for t in times.split(',') if len(t) > 0]:
                time_pieces = re.search(
                    r'(\d{2}:\d{2} [AP]M) - (\d{2}:\d{2} [AP]M)',
                    time
                )
                if time_pieces is None:
                    print("Skipping " + course['Title'] + " invalid time of " + time + ". Expecting a range.")
                    continue
                self.ingestor['time_start'] = time_pieces.group(1)
                self.ingestor['time_end'] = time_pieces.group(2)
                if (len(meeting['DOW'].strip()) > 0 and
                        meeting['DOW'] != "TBA" and
                        meeting['DOW'] != "None"):
                    self.ingestor['days'] = [Parser.DAY_MAP.get(d.lower()) for d in re.findall(r'(?:T[hH])|(?:S[aA])|[SMTWF]', meeting['DOW'])]
                    if self.ingestor['days'] is None:
                        continue
                    self.ingestor['location'] = {
                        'building': meeting['Building'],
                        'room': meeting['Room']
                    }
                    # print(self.ingestor)
                    self.ingestor.ingest_meeting(created_section)

    def start(self,
              verbosity=3,
              textbooks=False,
              departments_filter=None,
              years_and_terms_filter=None):
        """Start parse."""
        self.verbosity = verbosity

        # Default to hardcoded current year.
        years = {'2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'}
        terms = {'Spring', 'Fall', 'Summer', 'Intersession'}

        years_and_terms = dict_filter_by_dict(
            {year: [term for term in terms] for year in years},
            years_and_terms_filter
        )

        for year, terms in list(years_and_terms.items()):
            self.ingestor['year'] = year
            for term in terms:
                self.ingestor['term'] = term
                self.semester = '{} {}'.format(term, year)
                self._get_schools()
                self._parse_schools()
