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

import simplejson as json
import io

from copy import deepcopy
from django.test import TestCase, SimpleTestCase

from timetable.models import Semester, Course, Section, Offering
from parsing.library.utils import clean, make_list, DotDict, \
    safe_cast, update, iterrify, titlize, dict_filter_by_dict, \
    dict_filter_by_list, time24
from parsing.library.logger import JSONStreamWriter
from parsing.library.digestor import Digestor
from parsing.library.validator import Validator, ValidationError, \
    MultipleDefinitionsWarning, ValidationWarning
from collections import namedtuple
from timetable.school_mappers import SCHOOLS_MAP


class UtilsTest(SimpleTestCase):
    """Tests parsing.library.utils."""

    def test_clean(self):
        dirty1 = [None, 1, '2', False, [' ']]
        self.assertEqual([1, '2', False], clean(dirty1))
        dirty2 = {'a': [None, None]}
        self.assertEqual(None, clean(dirty2))
        dirty3 = '\u00a0\t \t\xa0'
        self.assertEqual(None, clean(dirty3))
        dirty4 = 'hello '
        self.assertEqual('hello', clean(dirty4))
        dirty5 = {'a': [None, 'b'], 4: [Exception, ' ', {0: [[None]]}]}
        self.assertEqual({'a': ['b'], 4: [Exception]}, clean(dirty5))

    def test_make_list(self):
        self.assertEqual([], make_list())
        self.assertEqual([], make_list(None))
        self.assertEqual(['hello'], make_list('hello'))
        self.assertEqual(['hello'], make_list(['hello']))
        self.assertEqual([{1: 1}], make_list({1: 1}))

    def test_dotdict(self):
        d = DotDict({'a': 1, 'b': 2, 'c': {'ca': 31}})
        self.assertEqual((1, 2), (d.a, d.b))
        self.assertEqual(1, d['a'])
        d['a'] = 3
        self.assertEqual((3, 2), (d.a, d['b']))
        self.assertEqual((31, 31), (d.c.ca, d.c['ca']))
        e = DotDict({'a': [{'b': 1}, {'c': 2}]})
        self.assertEqual(e.a[1]['c'], 2)

    def test_safe_cast(self):
        self.assertEqual(3.14159265, safe_cast('3.14159265', float))
        self.assertEqual(None, safe_cast('hi', float))
        self.assertEqual('None', safe_cast(None, str, default=':-)'))
        self.assertEqual(False, safe_cast('hi', int, default=False))

    def test_update(self):
        original = {
            0: {
                1: 2,
                3: 4
            },
            1: {
                2: 3,
                4: {5: 6}
            }
        }

        delta = {
            0: {
                3: 7
            },
            1: {
                5: 6
            }
        }

        updated = {
            0: {
                1: 2,
                3: 7
            },
            1: {
                2: 3,
                4: {5: 6},
                5: 6
            }
        }

        self.assertEqual(updated, update(original, delta))

    def test_iterrify(self):
        for i in iterrify(1):
            self.assertEqual(1, i)
        for i in iterrify([1]):
            self.assertEqual(1, i)
        for i in iterrify('hello'):
            self.assertEqual('hello', i)

    def test_titlize(self):
        self.assertEqual('Biology of Canines II',
                         titlize('BIOLOGY OF CANINES II'))
        self.assertEqual('After the Age of Extinction',
                         titlize('AFTer THE AGE oF extinction'))

    def test_time24(self):
        self.assertEqual('07:00', time24('7:00'))
        self.assertEqual('07:00', time24('7:00am'))
        self.assertEqual('19:01', time24('7:01pm'))

    def test_dict_filter_by_dict(self):
        original1 = {
            2016: {
                'Fall': 1,
                'Spring': 2,
            },
            2017: {
                'Fall': 3,
                'Spring': 4
            }
        }

        filtered = dict_filter_by_dict(original1, {2016: ['Fall']})
        self.assertEqual({2016: {'Fall': 1}}, filtered)

        original2 = {
            '2016': [
                'Fall',
                'Spring'
            ],
            '2017': [
                'Fall'
            ],
            '2018': []
        }
        filtered = dict_filter_by_dict(original2, {2016: ['Spring']})
        self.assertEqual({'2016': ['Spring']}, filtered)

    def test_dict_filter_by_list(self):
        original1 = {
            'A': 1,
            'B': 2,
            'C': {'E': 3},
            'D': 4
        }
        filtered = dict_filter_by_list(original1, {4, 'D', 'C', 'd'})
        self.assertEqual({'D': 4, 'C': {'E': 3}}, filtered)

        original2 = {
            'A',
            'B'
        }
        filtered = dict_filter_by_list(original2, {})
        self.assertEqual(set(), filtered)
        filtered = dict_filter_by_list(original2, original2)
        self.assertEqual(original2, filtered)


class JSONStreamWriterTest(SimpleTestCase):
    def test1(self):
        output = io.StringIO()
        with JSONStreamWriter(output, type_=dict) as streamer:
            streamer.write('a', 1)
            streamer.write('b', 2)
            streamer.write('c', 3)

        correct = {
            "a": 1,
            "b": 2,
            "c": 3
        }
        self.assertEqual(output.getvalue(),
                         json.dumps(correct,
                                    sort_keys=True,
                                    indent=2,
                                    separators=(',', ': ')))

        output = io.StringIO()
        with JSONStreamWriter(output, type_=dict) as streamer:
            streamer.write('a', 1)
            with streamer.write('data', type_=list) as streamer2:
                streamer2.write({0: 0, 1: 1, 2: 2})
                streamer2.write({3: 3, 4: '4'})
                streamer2.write(False)
            streamer.write('e', 2)

        correct = {
            "a": 1,
            "data":
            [
                {
                    0: 0,
                    1: 1,
                    2: 2
                },
                {
                    3: 3,
                    4: "4"
                },
                False
            ],
            "e": 2
        }
        self.assertEqual(
            output.getvalue(),
            json.dumps(correct,
                       sort_keys=True,
                       indent=2,
                       separators=(',', ': ')).replace(' [', '\n  [')
        )


class ValidationTest(SimpleTestCase):

    config = {
        'kind': 'config',
        'school': {
            'code': 'test',
            'name': 'University of Test'
        },
        'course_code_regex': '([A-Z]+)$',
        'terms': [
            'Foo',
            'Bar',
            'Baz'
        ],
        'granularity': 15,
        'ampm': True,
        'full_academic_year_registration': False,
        'single_access': False,
        'active_semesters': {
            '2017': [
                'Foo',
                'Bar'
            ],
            '2016': [
                'Foo',
                'Baz'
            ]
        },
        'campuses': [
            'Homewood'
        ]
    }

    def test_validator_flat(self):
        config_required = {
            'school',
            'course_code_regex',
            'terms',
            'single_access',
            'granularity',
            'full_academic_year_registration',
            'active_semesters',
            'ampm'
        }

        for req in config_required:
            invalid_config = {
                k: v for k, v in list(ValidationTest.config.items()) if k != req
            }
            with self.assertRaises(ValidationError):
                Validator(invalid_config)
        validator = Validator(ValidationTest.config)
        course = {
            'kind': 'course',
            'school': {
                'code': 'test'
            },
            'code': 'ABC',
            'name': 'Alphabet',
            'department': {
                'code': 'GHI',
                'name': 'English'
            },
            'credits': 3.,
            'prerequisites': ['ABC', 'DEF'],
            'corequisites': ['A', 'AB', 'BC', 'B', 'C'],
            'homepage': 'www.google.com',
            'same_as': ['ABD'],
            'description': 'Um, hi hello',
        }
        with self.assertRaises(ValidationError):
            invalid = deepcopy(course)
            invalid['school']['code'] = 'nottest'
            validator.validate(invalid)
        # with self.assertRaises(ValidationError):
        #     invalid = deepcopy(course)
        #     invalid['same_as'].append('abc')
        #     validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(course)
            invalid['code'] = 'abc'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(course)
            invalid['code'] = 'abc'
            validator.validate(invalid)
        validator.validate(course)
        with self.assertRaises(MultipleDefinitionsWarning):
            validator.validate(course)

        section = {
            'kind': 'section',
            'course': {
                'code': 'ABC',
            },
            'code': '001',
            'term': 'Bar',
            'year': '2017',
            'instructors': [
                {
                    'name': {
                        'first': 'Sem',
                        'last': 'Ly'
                    }
                },
                {
                    'name': 'Semesterly'
                }
            ],
            'capacity': 42,
            'enrollment': 41,
            'waitlist': 0,
            'waitlist_size': 100,
            'type': 'Lecture',
            'fees': 50.,
        }

        with self.assertRaises(ValidationError):
            invalid = deepcopy(section)
            invalid['course']['code'] = 'ABD'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(section)
            invalid['term'] = 'NotInConfig'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(section)
            invalid['capacity'] = -1
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(section)
            invalid['enrollment'] = -1
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(section)
            invalid['fees'] = 'NotAFloat'
            validator.validate(invalid)
        validator.validate(section)
        with self.assertRaises(MultipleDefinitionsWarning):
            validator.validate(section)

        meeting = {
            'kind': 'meeting',
            'course': {
                'code': 'ABC'
            },
            'section': {
                'code': '001',
                'year': '2017',
                'term': 'Bar'
            },
            'days': ['M', 'W', 'F'],
            'dates': {
                'start': '08-29-2017',
                'end': '12-10-2017',
            },
            'time': {
                'start': '14:00',
                'end': '14:50'
            },
            'location': {
                'campus': 'Homewood',
                'building': 'Malone',
                'room': 'Ugrad'
            },
            'is_short_course': False
        }

        with self.assertRaises(ValidationError):
            invalid = deepcopy(meeting)
            invalid['course']['code'] = 'ABD'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(meeting)
            invalid['section']['code'] = '002'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(meeting)
            invalid['section']['term'] = 'InvalidTerm'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(meeting)
            invalid['section']['year'] = '2018'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(meeting)
            invalid['time']['start'] = '15:00'
            validator.validate(invalid)
        # with self.assertRaises(ValidationWarning):
        #     invalid = deepcopy(meeting)
        #     invalid['time']['start'] = '14:50'
        #     validator.validate(invalid)
        with self.assertRaises(ValidationWarning):
            invalid = deepcopy(meeting)
            invalid['location']['campus'] = 'NotInConfigList'
            validator.validate(invalid)
        validator.validate(meeting)

        textbook_link = {
            'kind': 'textbook_link',
            'school': {
                'code': 'test'
            },
            'course': {
                'code': 'ABC'
            },
            'section': {
                'code': '001',
                'year': '2017',
                'term': 'Bar'
            },
            'isbn': '9780262033848',
            'required': True
        }

        with self.assertRaises(ValidationError):
            invalid = deepcopy(textbook_link)
            invalid['course']['code'] = 'abc'
            validator.validate(invalid)
        validator.validate(textbook_link)

    def test_validator_nested(self):
        validator = Validator(ValidationTest.config)
        nested_course = {
            'kind': 'course',
            'school': {
                'code': 'test'
            },
            'code': 'ABC',
            'name': 'Alphabet',
            'department': {
                'code': 'GHI',
                'name': 'English'
            },
            'credits': 3.,
            'prerequisites': ['ABC', 'DEF'],
            'corequisites': ['A', 'AB', 'BC', 'B', 'C'],
            'homepage': 'www.google.com',
            'same_as': ['ABD'],
            'description': 'Um, hi hello',
            'sections': [
                {
                    'code': '001',
                    'term': 'Bar',
                    'year': '2017',
                    'instructors': [
                        {
                            'name': {
                                'first': 'Sem',
                                'last': 'Ly'
                            }
                        },
                        {
                            'name': 'Semesterly'
                        }
                    ],
                    'capacity': 42,
                    'enrollment': 41,
                    'waitlist': 0,
                    'waitlist_size': 100,
                    'type': 'Lecture',
                    'fees': 50.,
                },
                {
                    'code': '002',
                    'term': 'Bar',
                    'year': '2017',
                    'instructors': [
                        {
                            'name': 'Semesterly'
                        }
                    ],
                    'capacity': 40,
                    'enrollment': 36,
                    'waitlist': 0,
                    'waitlist_size': 100,
                    'type': 'Lecture',
                    'fees': 50.,
                    'meetings': [
                        {
                            'days': ['M', 'F'],
                            'dates': {
                                'start': '08-29-2017',
                                'end': '12-10-2017',
                            },
                            'time': {
                                'start': '14:00',
                                'end': '14:50'
                            },
                            'location': {
                                'campus': 'Homewood',
                                'building': 'Malone',
                                'room': 'Ugrad'
                            },
                            'is_short_course': False
                        },
                        {
                            'days': ['W'],
                            'dates': {
                                'start': '08-29-2017',
                                'end': '12-10-2017',
                            },
                            'time': {
                                'start': '10:00',
                                'end': '12:15'
                            },
                            'is_short_course': False
                        }
                    ]
                }
            ]
        }

        with self.assertRaises(ValidationError):
            invalid = deepcopy(nested_course)
            invalid['sections'][0]['course'] = {'code': 'ABD'}
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(nested_course)
            invalid['sections'][1]['meetings'][1]['course'] = {'code': 'ABD'}
            validator.validate(invalid)
        with self.assertRaises(MultipleDefinitionsWarning):
            invalid = deepcopy(nested_course)
            invalid['sections'][1]['code'] = '001'
            validator.validate(invalid)
        with self.assertRaises(ValidationError):
            invalid = deepcopy(nested_course)
            invalid['sections'][1]['meetings'][1]['days'] = None
            validator.validate(invalid)

        validator.validate(nested_course)
        with self.assertRaises(MultipleDefinitionsWarning):
            validator.validate(nested_course)

_school_attrs = [
    'code',
    'name',
    'active_semesters',
    'granularity',
    'ampm',
    'full_academic_year_registration',
    'single_access',
    'final_exams parsers',
    'registrar',
    'short_course_weeks_limit'
]

School = namedtuple(
    'School',
    ' '.join(_school_attrs)
)

class DigestionTest(TestCase):

    config = {
        'kind': 'config',
        'school': {
            'code': 'test',
            'name': 'University of Test'
        },
        'course_code_regex': '([A-Z]+)$',
        'terms': [
            'Foo',
            'Bar',
            'Baz'
        ],
        'granularity': 15,
        'ampm': True,
        'full_academic_year_registration': False,
        'single_access': False,
        'active_semesters': {
            '2017': [
                'Foo',
                'Bar'
            ],
            '2016': [
                'Foo',
                'Baz'
            ]
        },
    }

    # Add "test" school config to SCHOOLS_MAP as it is used as part of digestion process
    # going forward.
    SCHOOLS_MAP['test'] = School(
        code=config['school']['code'],
        name=config['school']['name'],
        active_semesters=config['active_semesters'],
        granularity=config['granularity'],
        ampm=config['ampm'],
        full_academic_year_registration=config['full_academic_year_registration'],
        single_access=config['single_access'],
        final_exams=None,
        parsers=None,
        registrar=None,
        short_course_weeks_limit=None
    )

    def test_digest_flat(self):
        meta = {
            "$schools": {
                "salisbury": {
                    "2017": [
                        "Summer"
                    ]
                }
            },
            "$timestamp": 1502836183.235978
        }
        digestor = Digestor('test', meta)

        course = {
            'kind': 'course',
            'school': {
                'code': 'test'
            },
            'code': 'ABC',
            'name': 'Alphabet',
            'department': {
                'code': 'GHI',
                'name': 'English'
            },
            'credits': 3.,
            'prerequisites': ['ABC', 'DEF'],
            'corequisites': ['A', 'AB', 'BC', 'B', 'C'],
            'homepage': 'www.google.com',
            'description': 'Um, hi hello',
        }

        output = io.StringIO()
        digestor.digest(course, diff=True, load=False, output=output)
        diff = [
            {
                "$context": {},
                "$new": {
                    "code": "ABC",
                    "corequisites": "A, AB, BC, B, C",
                    "department": "English",
                    "description": "Um, hi hello",
                    "name": "Alphabet",
                    "num_credits": 3.0,
                    "prerequisites": "Pre: ABC, DEF Co: A, AB, BC, B, C",
                    "school": "test"
                }
            }
        ]
        self.assertEqual(
            json.dumps(diff, sort_keys=True, indent=2, separators=(',', ': ')),
            output.getvalue()
        )

        digestor.digest(course, diff=False, load=True)
        course_model = Course.objects.get(school='test',
                                          code='ABC',
                                          name='Alphabet')
        self.assertEqual(course_model.num_credits, 3.)
        self.assertEqual(course_model.department, 'English')
        self.assertEqual(course_model.corequisites, 'A, AB, BC, B, C')
        self.assertEqual(course_model.description, 'Um, hi hello')
        self.assertEqual(course_model.prerequisites,
                         'Pre: ABC, DEF Co: A, AB, BC, B, C')

        output = io.StringIO()
        digestor.digest(course, diff=True, load=True, output=output)
        self.assertEqual(len(eval(output.getvalue())), 0)

        course2 = {
            'kind': 'course',
            'school': {
                'code': 'test'
            },
            'code': 'ABD',
            'name': 'The second course',
            'department': {
                'name': 'Where'
            },
            'credits': 3.5,
            'same_as': ['ABC'],
        }
        digestor.digest(course2, diff=False, load=True)
        course2_model = Course.objects.get(school='test',
                                           code='ABD')
        self.assertEqual(course2_model.same_as, course_model)

        section = {
            'kind': 'section',
            'course': {
                'code': 'ABC',
            },
            'code': '001',
            'term': 'Bar',
            'year': '2017',
            'instructors': [
                {
                    'name': {
                        'first': 'Sem',
                        'last': 'Ly'
                    }
                },
                {
                    'name': 'Semesterly'
                }
            ],
            'capacity': 42,
            'enrollment': 41,
            'waitlist': 0,
            'waitlist_size': 100,
            'type': 'Lecture',
            'fees': 50.,
        }

        output = io.StringIO()
        digestor.digest(section, diff=True, load=True, output=output)
        diff = [
            {
                "$context": {
                    "course": "ABC: Alphabet",
                    "semester": "Bar 2017"
                },
                "$new": {
                    "enrolment": 41,
                    "instructors": "Sem LySemesterly",
                    "meeting_section": "001",
                    "section_type": "L",
                    "size": 42,
                    "waitlist": 0,
                    "waitlist_size": 100
                }
            }
        ]
        self.assertEqual(
            json.dumps(diff, sort_keys=True, indent=2, separators=(',', ': ')),
            output.getvalue()
        )
        section_model = Section.objects.get(
            course__school='test',
            course__code=section['course']['code'],
            meeting_section=section['code'],
            semester__year=section['year'],
            semester__name=section['term']
        )
        Semester.objects.get(year='2017', name='Bar')
        self.assertEqual(section_model.course, course_model)
        self.assertEqual(section_model.size, section['capacity'])
        self.assertEqual(section_model.waitlist, section['waitlist'])
        self.assertEqual(section_model.waitlist_size, section['waitlist_size'])
        self.assertEqual(section_model.section_type, 'L')
        self.assertEqual(section_model.enrolment, section['enrollment'])

        meeting = {
            'kind': 'meeting',
            'course': {
                'code': 'ABC'
            },
            'section': {
                'code': '001',
                'year': '2017',
                'term': 'Bar'
            },
            'days': ['M', 'W', 'F'],
            'dates': {
                'start': '08-29-2017',
                'end': '12-10-2017',
            },
            'time': {
                'start': '14:00',
                'end': '14:50'
            },
            'location': {
                'campus': 'Homewood',
                'building': 'Malone',
                'room': 'Ugrad'
            },
            'is_short_course': False
        }

        output = io.StringIO()
        digestor.digest(meeting, diff=True, load=True, output=output)
        diff = [
            {
                "$context": {
                    "section": "Course: ABC: Alphabet; Section: ABC: Alphabet; Semester: ABC: Alphabet"
                },
                "$new": {
                    "day": "M",
                    "location": "Malone Ugrad",
                    "date_start": "08-29-2017",
                    "date_end": "12-10-2017",
                    "time_end": "14:50",
                    "time_start": "14:00",
                    "is_short_course": False
                }
            },
            {
                "$context": {
                    "section": "Course: ABC: Alphabet; Section: ABC: Alphabet; Semester: ABC: Alphabet"
                },
                "$new": {
                    "day": "W",
                    "location": "Malone Ugrad",
                    "date_start": "08-29-2017",
                    "date_end": "12-10-2017",
                    "time_end": "14:50",
                    "time_start": "14:00",
                    "is_short_course": False
                }
            },
            {
                "$context": {
                    "section": "Course: ABC: Alphabet; Section: ABC: Alphabet; Semester: ABC: Alphabet"
                },
                "$new": {
                    "day": "F",
                    "location": "Malone Ugrad",
                    "date_start": "08-29-2017",
                    "date_end": "12-10-2017",
                    "time_end": "14:50",
                    "time_start": "14:00",
                    "is_short_course": False
                }
            }
        ]
        self.assertEqual(
            json.dumps(diff, sort_keys=True, indent=2, separators=(',', ': ')),
            output.getvalue()
        )
        self.assertEqual(
            len(Offering.objects.filter(section=section_model)),
            3
        )

    def test_digest_nested(self):
        meta = {
            "$schools": {
                "salisbury": {
                    "2017": [
                        "Summer"
                    ]
                }
            },
            "$timestamp": 1502836183.235978
        }
        digestor = Digestor('test', meta)

        nested_course = {
            'kind': 'course',
            'school': {
                'code': 'test'
            },
            'code': 'ABC',
            'name': 'Alphabet',
            'department': {
                'code': 'GHI',
                'name': 'English'
            },
            'credits': 3.,
            'prerequisites': ['ABC', 'DEF'],
            'corequisites': ['A', 'AB', 'BC', 'B', 'C'],
            'homepage': 'www.google.com',
            'same_as': ['ABD'],
            'description': 'Um, hi hello',
            'sections': [
                {
                    'code': '001',
                    'term': 'Bar',
                    'year': '2017',
                    'instructors': [
                        {
                            'name': {
                                'first': 'Sem',
                                'last': 'Ly'
                            }
                        },
                        {
                            'name': 'Semesterly'
                        }
                    ],
                    'capacity': 42,
                    'enrollment': 41,
                    'waitlist': 0,
                    'waitlist_size': 100,
                    'type': 'Lecture',
                    'fees': 50.,
                },
                {
                    'code': '002',
                    'term': 'Bar',
                    'year': '2017',
                    'instructors': [
                        {
                            'name': 'Semesterly'
                        }
                    ],
                    'capacity': 40,
                    'enrollment': 36,
                    'waitlist': 0,
                    'waitlist_size': 100,
                    'type': 'Lecture',
                    'fees': 50.,
                    'meetings': [
                        {
                            'days': ['M', 'F'],
                            'dates': {
                                'start': '08-29-2017',
                                'end': '12-10-2017',
                            },
                            'time': {
                                'start': '14:00',
                                'end': '14:50'
                            },
                            'location': {
                                'campus': 'Homewood',
                                'building': 'Malone',
                                'room': 'Ugrad'
                            },
                            'is_short_course': False
                        },
                        {
                            'days': ['W'],
                            'dates': {
                                'start': '08-29-2017',
                                'end': '12-10-2017',
                            },
                            'time': {
                                'start': '10:00',
                                'end': '12:15'
                            },
                            'is_short_course': False
                        }
                    ]
                }
            ]
        }

        output = io.StringIO()
        digestor.digest(nested_course, diff=True, load=True, output=output)

        diff = [
            {
                "$context": {},
                "$new": {
                    "code": "ABC",
                    "corequisites": "A, AB, BC, B, C",
                    "department": "English",
                    "description": "Um, hi hello",
                    "name": "Alphabet",
                    "num_credits": 3.0,
                    "prerequisites": "Pre: ABC, DEF Co: A, AB, BC, B, C",
                    "school": "test"
                }
            },
            {
                "$context": {
                    "course": "ABC: Alphabet",
                    "semester": "Bar 2017"
                },
                "$new": {
                    "enrolment": 41,
                    "instructors": "Sem LySemesterly",
                    "meeting_section": "001",
                    "section_type": "L",
                    "size": 42,
                    "waitlist": 0,
                    "waitlist_size": 100
                }
            },
            {
                "$context": {
                    "course": "ABC: Alphabet",
                    "semester": "Bar 2017"
                },
                "$new": {
                    "enrolment": 36,
                    "instructors": "Semesterly",
                    "meeting_section": "002",
                    "section_type": "L",
                    "size": 40,
                    "waitlist": 0,
                    "waitlist_size": 100
                }
            },
            {
                "$context": {
                    "section": "Course: ABC: Alphabet; Section: ABC: Alphabet; Semester: ABC: Alphabet"
                },
                "$new": {
                    "day": "M",
                    "location": "Malone Ugrad",
                    "date_start": "08-29-2017",
                    "date_end": "12-10-2017",
                    "time_end": "14:50",
                    "time_start": "14:00",
                    "is_short_course": False
                }
            },
            {
                "$context": {
                    "section": "Course: ABC: Alphabet; Section: ABC: Alphabet; Semester: ABC: Alphabet"
                },
                "$new": {
                    "day": "F",
                    "location": "Malone Ugrad",
                    "date_start": "08-29-2017",
                    "date_end": "12-10-2017",
                    "time_end": "14:50",
                    "time_start": "14:00",
                    "is_short_course": False
                }
            },
            {
                "$context": {
                    "section": "Course: ABC: Alphabet; Section: ABC: Alphabet; Semester: ABC: Alphabet"
                },
                "$new": {
                    "day": "W",
                    "location": " ",
                    "date_start": "08-29-2017",
                    "date_end": "12-10-2017",
                    "time_end": "12:15",
                    "time_start": "10:00",
                    "is_short_course": False
                }
            }
        ]
        self.assertEqual(
            json.dumps(diff, sort_keys=True, indent=2, separators=(',', ': ')),
            output.getvalue()
        )
