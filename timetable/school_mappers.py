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

"""This file contains all dicts which map a school to its associated object."""
import os

from collections import OrderedDict

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

# the smallest block size (in minutes) needed to describe start/end times
# > uoft classes only start on the hour or half hour, so granularity is 30min
school_to_granularity = {
    'jhu': 5,
    'uoft': 30,
    'umd': 5,
    'rutgers': 5,
    'uo': 5,
    'queens': 5,
    'vandy': 5,
    'gw': 5,
    'umich': 5,
    'chapman': 5,
    'salisbury': 5,
}

VALID_SCHOOLS = {
    "uoft",
    "jhu",
    "umd",
    "queens",
    "vandy",
    "gw",
    "umich",
    "chapman",
    "salisbury",
}

AM_PM_SCHOOLS = {
    "jhu",
    "umd",
    "rutgers",
    "vandy",
    "gw",
    "umich",
    "chapman",
    "salisbury",
}

FULL_ACADEMIC_YEAR_REGISTRATION_SCHOOLS = {
    "queens",
}

# Identifies schools that have user access restrictions so that
#  parsing can only happen one semester/term at a time.
SINGLE_ACCESS_SCHOOLS = {
    "gw",
}

school_code_to_name = {
    'jhu': 'Johns Hopkins University',
    'uoft': 'University of Toronto',
    'umd': 'University of Maryland',
    'rutgers': 'Rutgers University',
    'uo': 'University of Ottawa',
    'queens': 'Queens University',
    'vandy': 'Vanderbilt University',
    'gw': 'George Washington University',
    'umich': 'University of Michigan',
    'chapman': 'Chapman University',
    'salisbury': 'Salisbury University',
}

school_to_semesters = {
    'jhu': OrderedDict({
        2017: [
            'Fall',
            'Summer',
            'Spring',
        ],
    }),
    'uoft': OrderedDict({
        2018: [
            'Winter',
        ],
        2017: [
            'Fall',
            'Winter',
        ],
    }),
    'umd': OrderedDict({
        2017: [
            'Fall',
            'Spring',
        ],
    }),
    'rutgers': OrderedDict({
        2017: [
            'Spring',
        ],
        2016: [
            'Fall',
        ],
    }),
    'queens': OrderedDict({
        2018: [
            'Winter',
        ],
        2017: [
            'Fall',
            'Winter',
        ],
        2016: [
            'Fall',
        ],
    }),
    'vandy': OrderedDict({
        2017: [
            'Fall',
            'Spring',
        ],
        2016: [
            'Fall',
        ],
    }),
    'gw': OrderedDict({
        2017: [
            'Fall',
            'Spring',
        ],
    }),
    'umich': OrderedDict({
        2017: [
            'Fall',
            'Winter',
        ],
        2016: [
            'Fall',
        ],
    }),
    'chapman': OrderedDict({
        2017: [
            'Fall',
            'Spring',
        ],
        2016: [
            'Fall',
        ],
    }),
    'salisbury': OrderedDict({
        2017: [
            'Fall',
            'Summer',
            'Spring',
            'Winter',
            'Interterm',
        ],
        2016: [
            'Fall',
        ],
    }),
}


# TEMP: backwards compatibility hack - see #916
def _sem(term, year):
    return {'name': term, 'year': year}
old_school_to_semesters = {
    'jhu': [_sem('Fall', '2017'), _sem('Summer', '2017'), _sem('Spring', '2017'),
            _sem('Fall', '2016')],
    'uoft': [_sem('Winter', '2017'), _sem('Fall', '2016')],
    'umd': [_sem('Spring', '2017'), _sem('Fall', '2016')],
    'rutgers': [_sem('Spring', '2017'), _sem('Fall', '2016')],
    # 'uo': [_sem('Spring', '2017'), _sem('Fall', '2016')],
    'queens': [_sem('Winter', '2017'), _sem('Fall', '2016')],
    'vandy': [_sem('Fall', '2017'), _sem('Spring', '2017'), _sem('Fall', '2016')],
    'gw': [_sem('Fall', '2017'), _sem('Spring', '2017')],
    'umich': [_sem('Fall', '2017'), _sem('Winter', '2017'), _sem('Fall', '2016')],
    'chapman': [_sem('Fall', '2017'), _sem('Spring', '2017'), _sem('Fall', '2016')],
    'salisbury': [_sem('Fall', '2017'), _sem('Spring', '2017'), _sem('Winter', '2017'),
                  _sem('Fall', '2016'), _sem('Summer', '2017'), _sem('Interterm', '2017')],
}
# END TEMP

# do the imports: assumes all parser follow the same naming conventions:
# schoolname_parsertype where parsertype can be courses, evals, or textbooks
types = ['courses', 'evals', 'textbooks']
for school in VALID_SCHOOLS:
    for p_type in types:
        exec "from scripts.{0}.{0}_{1} import *".format(school, p_type)

# use lambdas to call constructor in a lazy fashion
course_parsers = {
    'uoft': lambda: UofTParser().start(),
}

new_course_parsers = {
    'chapman': lambda *args, **kwargs: ChapmanParser(**kwargs),
    'jhu': lambda *args, **kwargs: HopkinsParser(**kwargs),
    'umich': lambda *args, **kwargs: UmichParser(**kwargs),
    'queens': lambda *args, **kwargs: QueensParser(**kwargs),
    'salisbury': lambda *args, **kwargs: SalisburyParser(**kwargs),
    'vandy': lambda *args, **kwargs: VandyParser(**kwargs),
    'umd': lambda *args, **kwargs: UMDParser(**kwargs),
}

new_textbook_parsers = {
    'chapman': lambda *args, **kwargs: ChapmanParser(**kwargs),
    'gw': lambda *args, **kwargs: GWTextbookParser(**kwargs),
    'jhu': lambda *args, **kwargs: JHUTextbookParser(**kwargs),
    'umd': lambda *args, **kwargs: UMDTextbookParser(**kwargs),
    'umich': lambda *args, **kwargs: UmichTextbookParser(**kwargs),
    'vandy': lambda *args, **kwargs: VandyTextbookParser(**kwargs),
}

eval_parsers = {
    'jhu': lambda: HopkinsEvalParser().parse_evals(),
    'uoft': lambda: None,
    'umd': lambda: umdReview().parse_reviews,
    'rutgers': lambda: None,
    'uo': lambda: None,
    'queens': lambda: None,
}

textbook_parsers = {
    'uoft': parse_uoft_textbooks,
    'rutgers': lambda: None,
    'uo': lambda: None,
    'queens': parse_queens_textbooks,
}

final_exams_available = {
    'jhu': [_sem('Spring', '2017')]
}
