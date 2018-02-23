# Copyright (C) 2017 Semester.ly Technologies, LLC

# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from __future__ import absolute_import, division, print_function

import simplejson as json
from collections import OrderedDict, namedtuple
from django.conf import settings

from parsing.library.utils import DotDict
from parsing.schools.active import ACTIVE_SCHOOLS


_school_attrs = [
    'code',
    'name',
    'active_semesters',
    'granularity',
    'ampm',
    'full_academic_year_registration',
    'single_access',
    'final_exams parsers',
    'registrar'
]

School = namedtuple(
    'School',
    ' '.join(_school_attrs)
)


def load_school(school):
    config_file = '{}/{}/schools/{}/config.json'.format(settings.BASE_DIR,
                                                        settings.PARSING_MODULE,
                                                        school)
    with open(config_file) as f:
        config = DotDict(json.load(f))

    active_semesters = OrderedDict(
        sorted(config.active_semesters.items(), key=lambda x: x[0])
    )

    return School(code=config.school.code,
                  name=config.school.name,
                  active_semesters=active_semesters,
                  granularity=config.granularity,
                  ampm=config.ampm,
                  full_academic_year_registration=config.full_academic_year_registration,
                  single_access=config.single_access,
                  final_exams=config.get('final_exams'),
                  parsers=load_parsers(school),
                  registrar=config.get('registrar'))


def load_parsers(school):
    parsers = {}
    for parser_type in ['courses', 'evals', 'textbooks']:
        try:
            parser = None  # Binding below in exec.
            exec 'from {}.schools.{}.{} import Parser as parser'.format(
                settings.PARSING_MODULE,
                school,
                parser_type
            )
            parsers[parser_type] = parser
        except ImportError:
            pass
    return parsers


SCHOOLS_MAP = {school: load_school(school) for school in ACTIVE_SCHOOLS}

# course_parsers = {
#     'uoft': lambda: UofTParser().start(),
# }

# eval_parsers = {
#     'umd': lambda: umdReview().parse_reviews,
# }

# textbook_parsers = {
#     # 'uoft': parse_uoft_textbooks,
#     # 'queens': parse_queens_textbooks,
# }
