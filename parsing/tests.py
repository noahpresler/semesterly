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
import StringIO

from django.test import TestCase, SimpleTestCase

from parsing.library.utils import clean, make_list, DotDict, \
    safe_cast, update, iterrify, titlize, dict_filter_by_dict, \
    dict_filter_by_list, time24
from parsing.library.logger import JSONStreamWriter
from parsing.library.ingestor import Ingestor
from parsing.library.validator import Validator, ValidationError


class UtilsTest(SimpleTestCase):
    """Tests parsing.library.utils."""

    def test_clean(self):
        dirty1 = [None, 1, '2', False, [' ']]
        self.assertEqual([1, '2', False], clean(dirty1))
        dirty2 = {'a': [None, None]}
        self.assertEqual(None, clean(dirty2))
        dirty3 = u'\u00a0\t \t\xa0'
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
        output = StringIO.StringIO()
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

        output = StringIO.StringIO()
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
    }
}


class ValidateConfigTest(SimpleTestCase):

    def test_config_required(self):
        required = {
            'school',
            'course_code_regex',
            'terms',
            'single_access',
            'granularity',
            'full_academic_year_registration',
            'active_semesters',
            'ampm'
        }
        for req in required:
            invalid_config = {k: v for k, v in config.items() if k != req}
            with self.assertRaises(ValidationError):
                Validator(invalid_config)


class IngestorTest(SimpleTestCase):

    def setUp(self):
        pass
        # self.output = StringIO.StringIO()
        # self.ingestor = Ingestor(config, self.output)

    def test_ingest_course(self):
        pass
