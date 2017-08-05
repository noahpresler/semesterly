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
import simplejson as json

from parsing.common.textbooks.amazon import amazon_textbook_fields
from parsing.library.base_parser import BaseParser
from parsing.library.extractor import filter_years_and_terms


class BkstrDotComParser(BaseParser):
    """Textbook parser for Bkstr.com derivative schools."""

    URL = 'http://www.bkstr.com/webapp/wcs/stores/servlet/'

    def __init__(self, school, store_id, **kwargs):
        """Construct bkstr textbook parser."""
        self.school = school
        self.store_id = store_id
        super(BkstrDotComParser, self).__init__(school, **kwargs)

    def start(self,
              verbosity=3,
              years=None,
              terms=None,
              departments=None,
              **kwargs):
        """Start parsing."""
        self.cmd_years = years
        self.cmd_terms = terms
        self.cmd_departments = departments

        # Grab cookies from home website.
        self.requester.get('http://www.bkstr.com')

        query = {
            'storeId': self.store_id,
            'demoKey': 'd',
            'requestType': 'INITIAL',
            '_': ''
        }

        # TODO - fix requester issues by refreshing cookies on timeout

        programs = self._extract_json(query)
        for program, program_code in programs.items():
            self._parse_program(program, program_code, query)

    def _parse_program(self, program, program_code, query):
        query['programId'] = program_code
        query['requestType'] = 'TERMS'
        terms_and_years = self._extract_json(query)
        years_and_terms = self._parse_terms_and_years(terms_and_years)
        years_and_terms = filter_years_and_terms(years_and_terms,
                                                 self.cmd_years,
                                                 self.cmd_terms)
        for year, terms in years_and_terms.items():
            self.ingestor['year'] = year
            for term, term_code in terms.items():
                self._parse_term(term, term_code, query)

    def _parse_term(self, term, term_code, query):
        self.ingestor['term'] = term
        query['termId'] = term_code
        query['requestType'] = 'DEPARTMENTS'
        depts = self.extractor.filter_departments(self._extract_json(query),
                                                  self.cmd_departments)
        for dept, dept_code in depts.items():
            self._parse_dept(dept, dept_code, query)

    def _parse_dept(self, dept, dept_code, query):
        self.ingestor['department'] = {
            'code': dept
        }
        query['departmentName'] = dept_code
        query['requestType'] = 'COURSES'
        courses = self._extract_json(query)
        for course, course_code in courses.items():
            self.ingestor['course_code'] = '{} {}'.format(dept, course)
            self._parse_course(course, course_code, query)

    def _parse_course(self, course, course_code, query):
        query['courseName'] = course_code
        query['requestType'] = 'SECTIONS'
        sections = self._extract_json(query)
        for section, section_code in sections.items():
            self._parse_section(section, section_code, query)

    def _parse_section(self, section, section_code, query):
        self.ingestor['section_code'] = section

        query2 = {
            'categoryId': '9604',
            'storeId': self.store_id,
            'langId': '-1',
            'programId': query['programId'],
            'termId': query['termId'],
            'divisionDisplayName': ' ',
            'departmentDisplayName': query['departmentName'],
            'courseDisplayName': query['courseName'],
            'sectionDisplayName': section_code,
            'demoKey': 'd',
            'purpose': 'browse'
        }

        soup = self.requester.get(
            '{}/CourseMaterialsResultsView'.format(BkstrDotComParser.URL),
            query2
        )

        materials = soup.find_all('li', class_='material-group')
        for material in materials:
            self._parse_material(material)

    def _parse_material(self, material):
        required = re.match('material-group_(.*)', material['id']).group(1)
        self.ingestor['required'] = required == 'REQUIRED'
        books = material.find_all('ul')
        for book in books:
            isbn = book.find('span', id='materialISBN')
            isbn.find('strong').extract()
            isbn = isbn.text.strip()
            self.ingestor['isbn'] = str(isbn)
            self.ingestor.update(amazon_textbook_fields(isbn))
            self.ingestor.ingest_textbook()
            self.ingestor.ingest_textbook_link()

    def _extract_json(self, query):
        """Extract JSON from html response type.

        Bkstr.com returns response as json but labels it as html.
        """
        raw_text = self.requester.get(
            '{}/LocateCourseMaterialsServlet'.format(
                BkstrDotComParser.URL
            ),
            query,
            parse=False
        ).text

        return json.loads(
            re.search(
                r'\'(.*)\'',
                raw_text
            ).group(1)
        )['data'][0]

    @staticmethod
    def _parse_terms_and_years(term_and_years):
            years = {
                term_and_year.split()[1]: {}
                for term_and_year, code in term_and_years.items()
            }
            # Create nesting based on year.
            for year in years:
                years[year].update({
                    term_and_year.split()[0].title(): code
                    for term_and_year, code in term_and_years.items()
                    if term_and_year.split()[1] == year
                })
            return years
