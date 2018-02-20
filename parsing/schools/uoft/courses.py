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

from __future__ import absolute_import, division, print_function

import re

from collections import namedtuple
from bs4 import BeautifulSoup

from parsing.library.base_parser import BaseParser


Attribute = namedtuple('Attribute', 'name value')

class Parser(BaseParser):

    def __init__(self, **kwargs):
        super(Parser, self).__init__('uoft', **kwargs)

    def start(self, **kwargs):
        self.start_course_finder(**kwargs)
        self.start_artsci(**kwargs)

    # This encodes the following possibilities:
    #   1) Ignore field -- None
    #   2) Simply extract text data -- str
    #   3) Complex extraction -- lambda return (nested) field to value mappings
    LABEL_TO_FIELD = {
        'title': lambda x: Parser.extract_code_and_title(x),
        'Division': None,
        'Course Description': 'description',
        'Department': lambda x: Parser.extract_department(x),
        'Course Level': 'level',
        'Campus': None,
        'Pre-requisites': 'prerequisites',
        'Exclusion': 'exclusions',
        'UTSC Breadth': 'areas',
        'Term': lambda x: Parser.extract_term(x),
        'Course Meeting Sections': lambda x: Parser.extract_sections_and_meetings(x),

        # Course Meeting Sections
        'Activity': lambda x: Parser.extract_activity(x),
        'Day and Time': lambda x: Parser.extract_times(x),
        'Instructor': lambda x: Parser.extract_instructors(x),
        'Location': 'location',
        'Class Size': 'capacity',
        'Current Enrolment': 'enrollment',
        'Option to Waitlist': None,
        'Delivery Mode': None,
    }

    @staticmethod
    def resolve_attr(attr, default_resolver):
        field = Parser.LABEL_TO_FIELD.get(attr.name)
        if field is None:
            None
        if isinstance(field, str):
            return {field: default_resolver(attr)}
        elif callable(field):
            return field(attr.value)

    @staticmethod
    def extract_instructors(soup):
        instructors_string = soup.find('span').text.strip()
        return {
            'instructors': instructors_string[:100]
        }

    @staticmethod
    def extract_department(soup):
        return {
            'department': {
                'name': soup.text.strip()
            }
        }

    @staticmethod
    def extract_activity(soup):
        section_type, section_code = soup.find('span').text.strip().split()
        return {
            'section_type': {
                'Lec': 'Lecture',
                'Tut': 'Tutorial',
                'Pra': 'Practical'
            }[section_type],
            'section_code': section_code
        }

    @staticmethod
    def extract_term(soup):
        year, term = soup.text.strip().split()
        return {
            'year': int(year),
            'term': term
        }

    @staticmethod
    def extract_sections_and_meetings(soup):
        # TODO - find out what are dynamic-field-markers?
        if soup.find('table') is None:
            return []

        headers = map(
            lambda label: label.text.strip(),
            soup.find('table').thead.tr.find_all('label')
        )

        rows = map(
            lambda row: map(
                lambda pair: Attribute(*pair),
                zip(headers, row.find_all('td'))
            ),
            soup.find('table').tbody.find_all('tr')
        )

        def default_resolver(attr):
            return attr.value.find('span').text.strip()

        section_updates = []
        for row in rows:
            section_update = {}
            for attr in row:
                update = Parser.resolve_attr(attr, default_resolver)
                if update is None:
                    continue
                section_update.update(update)
            section_updates.append(section_update)

        return section_updates

    WEEKDAY_TIME_REGEX = re.compile(r'([A-Z]*) (\d{2}:\d{2})-(\d{2}:\d{2})')
    DAY_MAP = {
        'SUNDAY': 'U',
        'MONDAY': 'M',
        'TUESDAY': 'T',
        'WEDNESDAY': 'W',
        'THURSDAY': 'R',
        'FRIDAY': 'F',
        'SATURDAY': 'S'
    }

    @staticmethod
    def extract_times(soup):
        times_unformatted = soup.find('span').text.strip().splitlines()
        times = []
        for time in times_unformatted:
            matched = Parser.WEEKDAY_TIME_REGEX.match(time)
            times.append({
                'days': Parser.DAY_MAP[matched.group(1)],
                'time': {
                    'start': matched.group(2),
                    'end': matched.group(3)
                }
            })

        return {'_meetings': times}

    TITLE_REGEX = re.compile(r'(\w*): (.*)')
    @staticmethod
    def extract_code_and_title(text):
        matched = Parser.TITLE_REGEX.match(text)
        return {
            'code': matched.group(1),
            'name': matched.group(2)
        }


    URL = 'http://coursefinder.utoronto.ca/course-search/search'
    SEARCH_ENDPOINT = 'courseSearch/course/search'
    INQUIRY_ENDPOINT = 'courseInquiry'
    COURSE_FINDER_URL = 'http://coursefinder.utoronto.ca/course-search/search/courseSearch/course/search?queryText=&requirements=&campusParam=St.%20George,Scarborough,Mississauga'

    def start_course_finder(self, years_and_terms_filter=None, **kwargs):
        # params = {
        #     'queryText': '',
        #     'requirements': '',
        #     'campusParam': 'St.%20George,Scarborough,Mississauga',
        # }

        # NOTE: first request is needed to get the required cookies
        # self.requester.get(Parser.URL + '/' + Parser.SEARCH_ENDPOINT, params=params)
        # data = self.requester.get(Parser.URL + '/' + Parser.INQUIRY_ENDPOINT, params=params)

        # NOTE: first request is needed to get the required cookies
        self.requester.get(Parser.COURSE_FINDER_URL)
        data = self.requester.get(Parser.COURSE_FINDER_URL)

        for course_box in data.values()[0]:
            course_id = BeautifulSoup(course_box[1], 'html.parser').a['href'].split('/')[-1]
            course_soup = self.requester.get(Parser.URL + '/' + Parser.INQUIRY_ENDPOINT, params={
                'methodToCall': 'start',
                'viewId': 'CourseDetails-InquiryView',
                'courseId': course_id
            })

            # NOTE: UofT encodes their course listings page with label and value
            #       that can be identified together by a common tag id attribute
            attrs = map(
                lambda label: Attribute(
                    label.text.strip(),
                    course_soup.find('span', id=label['data-labelfor'])
                ),
                course_soup.find_all(lambda tag: tag.name == 'label' and 'data-labelfor' in tag.attrs)
            )

            attrs.append(Attribute(
                'title',
                course_soup.find('div', {'class': 'uif-pageHeader'}).find('span').text
            ))

            def default_resolver(attr):
                return attr.value.text.strip()

            for attr in attrs:
                update = Parser.resolve_attr(attr, default_resolver)
                if update is None:
                    continue
                self.ingestor.update(update)
            course = self.ingestor.ingest_course()

            times_attr = Attribute(
                'Course Meeting Sections',
                course_soup.find('div', id='Activity-details')
            )

            def default_resolver(attr):
                return None  # TODO
            section_updates = Parser.resolve_attr(times_attr, default_resolver)
            for section_update in section_updates:

                # Update ingestor with section info, minus nested meeting info.
                self.ingestor.update(
                    {k: v for k, v in section_update.items() if k != '_meetings'}
                )
                section = self.ingestor.ingest_section(course)

                for meeting_update in section_update['_meetings']:
                    self.ingestor.update(meeting_update)
                    self.ingestor.ingest_meeting(section)

    ARTSCI_URL = 'https://timetable.iit.artsci.utoronto.ca/api/{year}9/courses'

    def start_artsci(self, years_and_terms_filter=None, **kwargs):
        for year in years_and_terms.keys():
            data = self.requester.get(Parser.ARTSCI_URL.format(year=year), params={
                'org': '',
                'code': '',
                'section': 'F,S,Y',
                'studyyear': '',
                'daytime': '',
                'weekday': '',
                'prof': '',
                'breadth': '',
                'online': '',
                'waitlist': '',
                'available': '',
                'title': '',
            })

            # TODO - remove () in orgName
            for course in data.values():
                self.ingestor.update({
                    'code': course['code'],
                    'name': course['courseTitle'],
                    'description': course['courseDescription'],
                    'department': {
                        'code': course['org'],
                        'name': course['orgName']
                    },
                    'prerequisites': course['prerequisite'],
                    'corequisites': course['corequisite'],
                    'exclusions': course['exclusion'],
                    'areas': [
                        course['distributionCategories'],
                        course['breadthCategories']
                    ],
                    'credits': 1 if course['section'] == 'Y' else 0.5
                })

                course_obj = self.ingestor.ingest_course()

                # NOTE: this handles the case that a course is offered for
                #       both semesters. This functionality should be supported
                #       by ingestion models and deeper within the DB. See #1047
                terms = {
                    'F': ['Fall'],
                    'S': ['Winter'],
                    'Y': ['Fall', 'Winter']
                }[course['section']]

                for term in terms:
                    for section in course['meetings'].values():

                        if section['cancel'] == 'Cancelled':
                            continue

                        self.ingestor.update({
                            'section_code': section['sectionNumber'],
                            'section_name': section['subtitle'],
                            'type': {
                                'LEC': 'Lecture',
                                'TUT': 'Tutorial',
                                'PRA': 'Practical'
                            }[section['teachingMethod']],
                            'capacity': section['enrollmentCapacity'],
                            'enrollment': section['actualEnrolment'],
                            'waitlist': section['actualWaitlist'],
                            'is_online': section['online'] == "Online Meeting",
                            'year': course['session'][:-1],
                            'term': term
                        })

                        if isinstance(section['instructors'], dict):
                            self.ingestor['instructors'] = []
                            for instructor in section['instructors'].values():
                                self.ingestor['instructors'].append({
                                    'name': {
                                        'first': instructor['firstName'],
                                        'last': instructor['lastName']
                                    }
                                })

                        section_obj = self.ingestor.ingest_section(course_obj)

                        for offering in section['schedule'].values():
                            if offering['meetingDay'] is None:
                                continue

                            self.ingestor.update({
                                'days': {
                                    'MO': 'M',
                                    'TU': 'T',
                                    'WE': 'W',
                                    'TH': 'R',
                                    'FR': 'F'
                                }[offering['meetingDay']],
                                'time': {
                                    'start': offering['meetingStartTime'],
                                    'end': offering['meetingEndTime']
                                },
                                'location': offering['assignedRoom1']
                            })

                            self.ingestor.ingest_meeting(section)
