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

# TODO - consider moving much functionality to parsing.library.utils

from __future__ import absolute_import, division, print_function

import re
import unicodedata

from parsing.library.internal_exceptions import CourseParseError


def filter_departments(departments, cmd_departments=None, grouped=False):
    """Intersect department mappings.

    Args:
        department: dictionary of item <dept_code, dept_name>
    KwArgs:
        cmd_departments: department code list
        grouped: if grouped is set will not throw CoureParseError
    Return: filtered list of departments.
    """
    # FIXME -- if groups exists, will only search current group
    if cmd_departments is None:
        return departments

    # department list specified as cmd line arg
    for cmd_dept_code in cmd_departments:
        if cmd_dept_code not in departments and not grouped:
            raise CourseParseError('invalid dept {}'.format(cmd_dept_code))

    # Return dictionary of {code: name} or set {code}
    if isinstance(departments, dict):
        departments = {
            cmd_dept_code: departments[cmd_dept_code]
            for cmd_dept_code in cmd_departments
            if cmd_dept_code in departments
        }
    else:
        departments = {
            dept for dept in departments if dept in cmd_departments
        }

    return departments


def extract_info(course, text):
    """Attempt to extract info from text and put it into course object.

    Args:
        course (dict): course object to place extracted information into
        text (str): text to attempt to extract information from
    Returns:
        * modifies course object
        str: the text trimmed of extracted information
    """
    text = text.encode('utf-8', 'ignore')
    extractions = {
        'prereqs': [
            r'[Pp]r(?:-?)e[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
            r'T[Aa][Kk][Ee] (.*)\.?$'
        ],
        'coreqs': [
            r'[Cc]o(?:-?)[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*'
        ],
        'geneds': [
            r'GE (.*)'
        ],
        'fees': [
            r'(?:Lab )?Fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)'
        ]
    }

    for key, extraction_list in extractions.items():
        for extraction in extraction_list:
            rex = re.compile(extraction)
            extracted = rex.search(text)
            if extracted:
                course.setdefault(key, [])
                if 'fees' == key and isinstance(course.get(key), float):
                    continue  # NOTE: edge case if multiple fees present
                course[key] += [extracted.group(1)]
                # FIXME -- this library does not enforce this, unsafe!
            if isinstance(text, str):
                text = text.decode('utf-8')
                text = unicodedata.normalize('NFKD', text)
            text = rex.sub('', text).strip()

    # Convert fees to float
    # BUG: edge case, if mutliple fees have been extracted will take the first
    if course.get('fees'):
        try:
            course['fees'] = float(course['fees'][0])
        except ValueError:
            course['fees'] = None
        except IndexError:
            course['fees'] = None

    # NOTE: for now, combine pre and co reqs
    requisites = []
    corequisites = []
    if hasattr(course.get('prereqs'), '__iter__'):
        try:
            for req in course['prereqs']:
                req = req.strip()
                if len(req) == 0:
                    continue
                requisites += [req]
        except UnicodeDecodeError:
            pass
    if hasattr(course.get('coreqs'), '__iter__'):
        try:
            for req in course['coreqs']:
                req = req.strip()
                if len(req) == 0:
                    continue
                corequisites += [req]
        except UnicodeDecodeError:
            pass

    if len(requisites) > 0:
        if 'prereqs' in course:
            course['prereqs'] += requisites
            course['prereqs'] = list(set(course['prereqs']))
        if 'coreqs' in course:
            course['coreqs'] += corequisites
            course['coreqs'] = list(set(course['coreqs']))

    return text


class Extractor():

    def extract_info(self, course, text):
        ''' Attempts to extract info from text and put it into course object.

        Args:
            course (dict): course object to place extracted information into
            text (str): text to attempt to extract information from

        Returns:
            * modifies course object
            str: the text trimmed of extracted information
        '''
        text = text.encode('utf-8', 'ignore')
        extractions = {
            'prereqs': [
                r'[Pp]r(?:-?)e[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
                r'T[Aa][Kk][Ee] (.*)\.?$'
            ],
            'coreqs': [
                r'[Cc]o(?:-?)[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*'
            ],
            'geneds': [
                r'GE (.*)'
            ],
            'fees': [
                r'(?:Lab )?Fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)'
            ]
        }

        for key, extraction_list in extractions.items():
            for extraction in extraction_list:
                rex = re.compile(extraction)
                extracted = rex.search(text)
                if extracted:
                    if not course.get(key):
                        course[key] = []
                    if 'fees' == key and isinstance(course.get(key), float):
                        continue  # NOTE: edge case if multiple fees present
                    course[key] += [extracted.group(1)] # okay b/c of course_cleanup
                    # FIXME -- this library does not enforce this, unsafe!
                if isinstance(text, str):
                    text = text.decode('utf-8')
                    text = unicodedata.normalize('NFKD', text)
                text = rex.sub('', text).strip()

        # Convert fees to float
        # NOTE: edge case, if mutliple fees have been extracted will take the first one only
        if course.get('fees') and isinstance(course['fees'], list):
            try:
                course['fees'] = float(course['fees'][0])
            except ValueError:
                course['fees'] = None

        # NOTE: for now, combine pre and co reqs
        requisites = []
        corequisites = []
        if hasattr(course.get('prereqs'), '__iter__'):
            try:
                for req in course['prereqs']:
                    req = req.strip()
                    if len(req) == 0:
                        continue
                    requisites += [req]
                    # requisites += 'Prerequisite: ' + ','.join(course.get('prereqs'))
            except UnicodeDecodeError:
                pass
        if hasattr(course.get('coreqs'), '__iter__'):
            try:
                for req in course['coreqs']:
                    req = req.strip()
                    if len(req) == 0:
                        continue
                    corequisites += [req]
                # requisites += ' Corequisite: ' + ','.join(course.get('coreqs'))
            except UnicodeDecodeError:
                pass

        if len(requisites) > 0:
            if 'prereqs' in course:
                course['prereqs'] += requisites
                course['prereqs'] = list(set(course['prereqs'])) # uniqueify
            if 'coreqs' in course:
                course['coreqs'] += corequisites
                course['coreqs'] = list(set(course['coreqs']))

        return text

    '''REGEX Analysis: (regex101.com)
        r'(?:Lab )?Fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)'
            Fee 30
            Fee $30
            Fees 3000.00
            Fees: $125
            Fees: $ 125.00
            Fees:  125
            Fee fdgdsad 123
            Lab Fee fdgdsad 123
            Fee: 30
            Fees: $400.
            Fees: $400.00
            Lab Fee 20
    '''

    @staticmethod
    def filter_departments(departments, cmd_departments=None, grouped=False):
        '''Filter department dictionary to only include those departments listed in cmd_departments, if given
        Args:
            department: dictionary of item <dept_code, dept_name>
        KwArgs:
            cmd_departments: department code list
            grouped: if grouped is set will not throw CoureParseError
        Return: filtered list of departments.
        '''

        # FIXME -- if groups exists, will only search current group
        if cmd_departments is None:
            return departments

        # department list specified as cmd line arg
        for cmd_dept_code in cmd_departments:
            if cmd_dept_code not in departments and not grouped:
                raise CourseParseError('invalid department code {}'.format(cmd_dept_code))

        # Return dictionary of {code: name} or set {code}
        if isinstance(departments, dict):
            departments = {cmd_dept_code: departments[cmd_dept_code] for cmd_dept_code in cmd_departments if cmd_dept_code in departments}
        else:
            departments = {dept for dept in departments if dept in cmd_departments}

        return departments

    _ROMAN_NUMERAL = re.compile(r'^[iv]+$')
