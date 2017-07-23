# The Pitt API, to access workable data of the University of Pittsburgh
# Copyright (C) 2015 Ritwik Gupta
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

import urllib2
import subprocess
import re

from BeautifulSoup import BeautifulSoup


class InvalidParameterException(Exception):
    pass


class CourseAPI:
    def __init__(self):
        pass

    @staticmethod
    def _retrieve_from_url(url):
        page = urllib2.urlopen(url)
        soup = BeautifulSoup(page.read())
        courses = soup.findAll("tr", {"class": "odd"})
        courses_even = soup.findAll("tr", {"class": "even"})
        courses.extend(courses_even)
        return courses

    def get_courses(self, term, subject):
        """
        :returns: a list of dictionaries containing the data for all SUBJECT classes in TERM

        :param: term: String, term number
        :param: subject: String, course abbreviation
        """

        subject = subject.upper()

        url = 'http://www.courses.as.pitt.edu/results-subja.asp?TERM={}&SUBJ={}'.format(term, subject)
        courses = self._retrieve_from_url(url)

        course_details = []

        for course in courses:
            details = [course_detail.string.replace('&nbsp;', '').strip()
                       for course_detail in course
                       if course_detail.string is not None
                       and len(course_detail.string.strip()) > 2]

            course_details.append(
                {
                    'catalog_number': details[0],
                    'term': details[1].replace('\r\n\t', ''),
                    'title': details[2],
                    'class_number': course.find('a').contents[0],
                    'instructor': details[3] if len(details[3]) > 0 else 'Not decided',
                    'credits': details[4]
                }
            )

        if len(course_details) == 0:
            raise InvalidParameterException("The TERM or SUBJECT is invalid")

        return course_details

    @staticmethod
    def _get_course_dict(details):

        course_details = []

        if len(details) == 6:
            course_details.append(
                {
                    'subject': details[0],
                    'catalog_number': details[1],
                    'term': details[2].replace('\r\n\t', ' '),
                    'title': details[3],
                    'instructor': details[4] if len(details[4]) > 0 else 'Not decided',
                    'credits': details[5]
                }
            )
        else:
            course_details.append(
                {
                    'subject': 'Not available',
                    'catalog_number': details[0],
                    'term': details[1].replace('\r\n\t', ' '),
                    'title': details[2].replace('\r\n\t', ' '),
                    'instructor': details[3] if len(details[3]) > 0 else 'Not decided',
                    'credits': details[4]
                }
            )

        return course_details

    def get_courses_by_req(self, term, req):
        """
        :returns: a list of dictionaries containing the data for all SUBJECT classes in TERM

        :param: term: String, term number
        :param: req: String, requirement abbreviation
        """

        req = req.upper()

        url = 'http://www.courses.as.pitt.edu/results-genedreqa.asp?REQ={}&TERM={}'.format(req, term)
        page = urllib2.urlopen(url)
        soup = BeautifulSoup(page.read())
        courses = soup.findAll("tr", {"class": "odd"})
        courses_even = soup.findAll("tr", {"class": "even"})
        courses.extend(courses_even)

        course_details = []

        for course in courses:
            temp = []
            for i in course:
                try:
                    if len(i.string.strip()) > 2:
                        temp.append(i.string.strip())
                except (TypeError, AttributeError) as e:
                    pass

            for i in range(len(temp)):
                temp[i] = temp[i].replace('&nbsp;', '')

            if len(temp) == 6:
                course_details.append(
                    {
                        'subject': temp[0].strip(),
                        'catalog_number': temp[1].strip(),
                        'term': temp[2].replace('\r\n\t', ' '),
                        'title': temp[3].strip(),
                        'instructor': 'Not decided' if len(temp[4].strip()) == 0 else temp[4].strip(),
                        'credits': temp[5].strip()
                    }
                )
            else:
                course_details.append(
                    {
                        'subject': 'Not available',
                        'catalog_number': temp[0].strip(),
                        'term': temp[1].strip().replace('\r\n\t', ' '),
                        'title': temp[2].replace('\r\n\t', ' '),
                        'instructor': 'Not decided' if len(temp[3].strip()) == 0 else temp[3].strip(),
                        'credits': temp[4].strip()
                    }
                )

        if len(course_details) == 0:
            raise InvalidParameterException("The TERM or REQ is invalid")

        return course_details

    @staticmethod
    def get_class_description(class_number, term):
        """
        :returns: a string that is the description for CLASS_NUMBER in term TERM

        :param: class_number: String, class number
        :param: term: String, term number
        """

        url = 'http://www.courses.as.pitt.edu/detail.asp?CLASSNUM={}&TERM={}'.format(class_number, term)
        page = urllib2.urlopen(url)
        soup = BeautifulSoup(page.read())
        table = soup.findChildren('table')[0]
        rows = table.findChildren('tr')

        has_description = False
        for row in rows:
            cells = row.findChildren('td')
            for cell in cells:
                if has_description:
                    return cell.string.strip()
                if len(cell.contents) > 0 and str(cell.contents[0]) == '<strong>Description</strong>':
                    has_description = True