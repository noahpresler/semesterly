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

import sys
import re
import unicodedata


def extract_info(course, text):
    """Attempt to extract info from text and put it into course object.

    Args:
        course (dict): course object to place extracted information into
        text (str): text to attempt to extract information from
    Returns:
        * modifies course object
        str: the text trimmed of extracted information
    """
    # TODO - this method needs to be structured in a more extensible way
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
            if isinstance(text, str):
                text = text.decode('utf-8')
                text = unicodedata.normalize('NFKD', text)
            text = rex.sub('', text).strip()

    # NOTE: edge case, if mutliple fees have been extracted will take the first
    if course.get('fees') and isinstance(course.get('fees'), list):
        course['fees'] = course['fees'][0]

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
