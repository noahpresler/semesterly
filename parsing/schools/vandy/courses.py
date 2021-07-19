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

import re

from parsing.library.base_parser import BaseParser
from parsing.library.exceptions import ParseError, ParseJump
from parsing.library.utils import dict_filter_by_dict, dict_filter_by_list
from semesterly.settings import get_secret


class Parser(BaseParser):
    """Vanderbilt course parser.

    Attributes:
        course (TYPE): Description
        departments (dict): Description
        URL (str): Description
        verbosity (TYPE): Description
    """

    URL = 'https://webapp.mis.vanderbilt.edu/more'
    KEY_MAP = {
        'School': 'school_subdivision_name',
        'Career': 'level',
        'Component': 'section_type',
        'Hours': 'num_credits',
        'Consent': 'exclusions',
        'Requirement(s)': 'prerequisites',
        'Class Capacity': 'capacity',
        'Total Enrolled': 'enrollment',
        'Available Seats': 'remaining_seats',
        'Wait List Capacity': 'waitlist_size',
        'Total on Wait List': 'waitlist',
        'Location': 'location'
    }

    def __init__(self, **kwargs):
        """Construct parser instance.

        Args:
            **kwargs: pass-through
        """
        super(Parser, self).__init__('vandy', **kwargs)

    def _login(self):
        login_url = 'https://login.mis.vanderbilt.edu'
        params = {
            'service': Parser.URL + '/j_spring_cas_security_check'
        }
        soup = self.requester.get(login_url + '/login', params=params)
        self.requester.post(
            login_url + soup.find('form', {'name': 'loginForm'})['action'],
            parse=False,
            params=params,
            data={
                'username': get_secret('VANDY_USER'),
                'password': get_secret('VANDY_PASS'),
                'lt': soup.find('input', {'name': 'lt'})['value'],
                '_eventId': 'submit',
                'submit': 'LOGIN'
            },
        )
        self.requester.get(Parser.URL + '/Entry.action', parse=False)

    def start(self,
              verbosity=3,
              textbooks=True,
              departments_filter=None,
              years_and_terms_filter=None):
        """Start the parse."""
        self.verbosity = verbosity

        self._login()

        years_and_terms = dict_filter_by_dict(self._parse_years_and_terms(),
                                              years_and_terms_filter)
        for year, terms in years_and_terms.items():
            self.ingestor['year'] = year
            for term_name, term_code in terms.items():
                self.ingestor['term'] = term_name

                # Load environment for targeted semester
                self.requester.get(
                    Parser.URL + '/SelectTerm!selectTerm.action',
                    params={'selectedTermCode': term_code},
                    parse=False
                )

                self.requester.get(
                    Parser.URL + '/SelectTerm!updateSessions.action',
                    parse=False
                )

                # Create payload to request course list from server
                params = {
                    'searchCriteria.classStatusCodes': [
                        'O', 'W', 'C'
                    ],
                    '__checkbox_searchCriteria.classStatusCodes': [
                        'O', 'W', 'C'
                    ]
                }

                departments = dict_filter_by_list(
                    dict(self.extract_department_codes()),
                    departments_filter
                )
                for dept_code, dept_name in departments.items():
                    self.ingestor['department_code'] = dept_code
                    self.ingestor['department_name'] = dept_name

                    # Construct payload with department code
                    params.update({
                        'searchCriteria.subjectAreaCodes': dept_code
                    })

                    # GET html for department course listings
                    soup = self.requester.get(
                        Parser.URL + '/SearchClassesExecute!search.action',
                        params=params
                    )

                    # Parse courses in department
                    self.parse_courses_in_department(soup)

                # return to search page for next iteration
                self.requester.get(Parser.URL + '/Entry.action',
                                   parse=False)

    def _parse_years_and_terms(self):
        soup = self.requester.get(Parser.URL + '/SearchClasses!input.action')
        years_and_terms = {}
        for sem in soup.find('select', id='selectedTerm').find_all('option'):
            year, term = sem.text.split()
            if term == 'Year':
                continue
            year = years_and_terms.setdefault(int(year), {})
            year[term] = sem['value']
        return years_and_terms

    def extract_department_codes(self):
        # Query Vandy class search website
        soup = self.requester.get(Parser.URL + '/SearchClasses!input.action')

        # Retrieve all deparments from dropdown in advanced search
        department_entries = soup.find_all(
            id=re.compile(r'subjAreaMultiSelectOption[0-9]')
        )

        # Extract department codes from parsed department entries
        departments = []
        for de in department_entries:
            departments.append((de['value'], de['title']))

        return departments

    def parse_courses_in_department(self, html):
        # Check number of results isn't over max
        num_hits_search = re.search(r'totalRecords: ([0-9]*),', str(html))

        num_hits = 0
        if num_hits_search is not None:
            num_hits = int(num_hits_search.group(1))

        if num_hits == 300:
            raise ParseError('vandy num_hits greater than 300')

        self.parse_set_of_courses(html)

    def parse_set_of_courses(self, html):
        prev_course_number = 0
        page_count = 1

        while True:
            # Parse page by page
            last_class_number = self.parse_page_of_courses(html)

            # Condition met when reached last page
            if last_class_number == prev_course_number:
                break

            html = self.requester.get(
                Parser.URL + '/SearchClassesExecute!switchPage.action',
                params={'pageNum': page_count + 1}
            )
            prev_course_number = last_class_number

    def parse_page_of_courses(self, soup):
        last_class_number = 0
        for course in soup.find_all('tr', class_='classRow'):

            try:
                last_class_number = self.parse_course(course)
            except ParseJump:
                pass

        return last_class_number

    def parse_course(self, soup):
        # remove cancelled classes
        if soup.find('a', class_='cancelledStatus'):
            raise ParseJump('cancelled course')

        # Extract course code and term number to generate access to more info
        details = soup.find('td', class_='classSection')['onclick']

        # Extract course number and term code
        search = re.search(
            r"showClassDetailPanel.fire\({classNumber : '([0-9]*)', termCode : '([0-9]*)',",
            details
        )
        course_number = search.group(1)

        soup = self.requester.get(
            Parser.URL + '/GetClassSectionDetail.action',
            params={
                'classNumber': course_number,
                'termCode': search.group(2)
            }
        )

        # Extract course name and abbreviation details
        search = re.search(
            r'(.*):.*\n(.*)',
            soup.find(id='classSectionDetailDialog').find('h1').text)
        abbr = search.group(1)

        # Extract department code, catalog ID, and section number from abbr
        title = re.match(r'(\S*)-(\S*)-(\S*)', abbr)

        if not title:
            raise ParseJump('no title in course')

        self.ingestor['course_name'] = search.group(2)
        self.ingestor['course_code'] = title.group(1) + '-' + title.group(2)
        self.ingestor['section_code'] = '(' + title.group(3).strip() + ')'

        # Deal with course details as subgroups seen on details page
        detail_headers = soup.find_all('div', class_='detailHeader')
        detail_panels = soup.find_all('div', class_='detailPanel')

        if len(detail_headers) != len(detail_panels):
            raise ParseError('there should be equal detail headers and panels')

        for i in range(len(detail_headers)):

            # Extract header name
            header = detail_headers[i].text.strip()

            # Choose parsing strategy dependent on header
            if header == "Details" or header == "Availability":
                self.parse_labeled_table(detail_panels[i])

            elif header == "Description":
                self.extract_description(detail_panels[i])

            elif header == "Notes":
                self.extract_notes(detail_panels[i])

            elif header == "Meeting Times":
                self.parse_meeting_times(detail_panels[i])

            elif header == "Cross Listings":
                pass

            elif header == "Attributes":
                self.parse_attributes(detail_panels[i])

            elif header == "Ad Hoc Meeting Times":
                pass

        course = self.ingestor.ingest_course()
        self.ingestor.ingest_section(course)
        self.ingestor['meetings'] = []

        return course_number

    def parse_attributes(self, soup):
        labels = [l.text.strip() for l in soup.find_all('div', class_='listItem')]
        self.ingestor['areas'] = labels

    def parse_labeled_table(self, soup):

        # Gather all labeled table entries
        labels = soup.find_all('td', class_='label')

        for label in labels:
            siblings = label.find_next_siblings()
            # Check if label value exists
            if len(siblings) != 0:

                # Extract pure label from html
                key = label.text[:-1].strip()

                # Extract label's value(s) [deals with multiline multi-values]
                values = [l for l in (line.strip() for line in siblings[0].text.splitlines()) if l]

                if key not in Parser.KEY_MAP:
                    continue

                # Edge cases
                if key == "Books":
                    values = []
                elif key == "Consent" and values[0] == "No Special Consent Required":
                    values[0] = ''

                self.ingestor[Parser.KEY_MAP[key]] = ', '.join(values)

    def parse_meeting_times(self, soup):
        # Gather all labeled table entries
        labels = soup.find_all('th', class_='label')

        if len(labels) <= 0:
            return

        values = soup.find(
            'tr',
            class_='courseHeader'
        ).find_next_siblings()[0].find_all('td')

        if len(labels) != len(values):
            raise ParseError('number of labels and values should be the same')

        try:
            for label, value in zip([x.text.strip() for x in labels],
                                    [x.text.strip() for x in values]):
                if len(label) <= 0 or len(value) <= 0:
                    continue

                if label == 'Instructor(s)':
                    self.extract_instructors(value)

                elif label == 'Time':
                    self.extract_time_range(value)

                elif label == 'Days':
                    self.extract_days(value)
        except ParseJump:
            pass

        meetings = self.ingestor.setdefault('meetings', [])
        meetings.append(self.ingestor.ingest_meeting({}, clean_only=True))

    def extract_days(self, unformatted_days):
        if unformatted_days == 'TBA' or unformatted_days == '':
            raise ParseJump(self.ingestor['course_code'] + ' days TBA')
        self.ingestor['days'] = list(unformatted_days)

    def extract_time_range(self, unformatted_time_range):
        if unformatted_time_range == 'TBA' or unformatted_time_range == '':
            raise ParseJump(self.ingestor['course_code'] + ' time TBA')

        search = re.match(r'(.*) \- (.*)', unformatted_time_range)
        if search is None:
            raise ParseJump('time not found on page')

        def ampm(x):
            return x.replace('a', 'am').replace('p', 'pm')
        self.ingestor['time_start'] = ampm(search.group(1))
        self.ingestor['time_end'] = ampm(search.group(2))

    def extract_instructors(self, string):

        instructors = string.splitlines()

        for i in range(len(instructors)):

            # Deal with instance of primary instructor
            search = re.match(r'(.*) \(Primary\)', instructors[i])
            if search is not None:
                instructors[i] = search.group(1)

        self.ingestor['instrs'] = instructors

    def extract_notes(self, soup):
        notes = ' '.join([l for l in (p.strip() for p in soup.text.splitlines()) if l]).strip()
        description = self.ingestor.setdefault('description', [])
        if isinstance(description, list):
            description.append(notes)
        elif isinstance(description, str):
            description += '\n' + notes

    def extract_description(self, soup):
        description = soup.text.strip()
        match = re.match(r'(\[Formerly .*?\] )([\s\S]*)', description)
        if match is not None:
            match2 = re.match(r'\[Formerly (.*?)\]', match.group(1))
            description = match.group(2)
            self.ingestor['same_as'] = match2.group(1)
        self.ingestor['description'] = description
