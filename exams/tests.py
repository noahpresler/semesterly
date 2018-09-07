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

import unittest

from rest_framework import status
from rest_framework.test import APITestCase

from jhu_final_exam_scheduler import *
from helpers.test.test_cases import UrlTestCase

SCHEDULER = JHUFinalExamScheduler()


class UrlsTest(UrlTestCase):
    """ Test exams/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/final_exams/',
                                     'helpers.mixins.FeatureFlowView')

        self.assertUrlResolvesToView('/exams/', 'exams.views.ExamView')
        self.assertUrlResolvesToView('/exams/links/', 'exams.views.ExamLink')
        self.assertUrlResolvesToView(
            '/exams/links/AbC/', 'exams.views.ExamLink')


class ExamLinkTest(APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def test_create_then_get_link(self):
        data = {
            "courses": [
                {
                    "code": "EN.550.171",
                    "id": "3546",
                    "name": "Discrete Mathematics",
                    "slots": [
                        {
                            "time_start": "9:00",
                            "section_type": "L",
                            "time_end": "9:50",
                            "day": "M",
                            "code": "EN.550.171",
                            "name": "Discrete Mathematics",
                            "semester": {"year": "2017", "name": "Fall"},
                        }
                    ]
                }
            ]
        }
        response = self.client.post(
            '/exams/links/',
            data,
            format='json',
            **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('slug', response.data)

        slug = response.data['slug']

        # assumes that the response will be a 404 if post did not actually
        # create a shared timetable
        response = self.client.get(
            '/exams/links/{}/'.format(slug),
            **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ExamSchedulerTest(unittest.TestCase):
    def test_monday_8am(self):
        fixture = {
            "courses": [
               {
                   "code": "EN.550.171",
                   "name": "Discrete Mathematics",
                   "id": "3546",
                   "slots": [
                       {
                           "time_start": "12:00",
                           "section_type": "L",
                           "time_end": "12:50",
                           "day": "R",
                           "code": "EN.550.171",
                           "name": "Discrete Mathematics",
                           "semester": {"name": "Spring", "year": "2017"}
                       },
                       {
                           "time_start": "8:00",
                           "section_type": "L",
                           "time_end": "8:50",
                           "day": "F",
                           "code": "EN.550.171",
                           "name": "Discrete Mathematics",
                           "semester": {"name": "Spring", "year": "2017"}
                       },
                       {
                           "time_start": "8:00",
                           "section_type": "L",
                           "time_end": "8:50",
                           "day": "W",
                           "code": "EN.550.171",
                           "name": "Discrete Mathematics",
                           "semester": {"name": "Spring", "year": "2017"}
                       },
                       {
                           "time_start": "8:00",
                           "section_type": "L",
                           "time_end": "8:50",
                           "day": "M",
                           "code": "EN.550.171",
                           "name": "Discrete Mathematics",
                           "semester": {"name": "Spring", "year": "2017"}
                       }
                   ]
               }
            ]
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture),
            {3546: {'time': '5/18 9-12', 'code': 'EN.550.171', 'name': 'Discrete Mathematics'}}
        )

    def test_monday_9am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "9:00",
                    "section_type": "L",
                    "time_end": "9:50",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {
                        "year": "2017",
                        "name": "Spring"
                    }
                }]
            }]
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture), {
                3546: {
                    'time': '5/17 9-12',
                    'code': 'EN.550.171',
                    'name': 'Discrete Mathematics'
                }
            }
        )

    def test_monday_10am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "10:00",
                    "section_type": "L",
                    "time_end": "10:50",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture), {
                3546: {
                    'time': '5/16 9-12',
                    'code': 'EN.550.171',
                    'name': 'Discrete Mathematics'
                }
            }
        )

    def test_monday_11am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "11:00",
                    "section_type": "L",
                    "time_end": "_",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {
                        "year": "2017",
                        "name": "Spring"
                    }
                }]
            }]
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture), {
                3546: {
                    'time': '5/15 9-12',
                    'code': 'EN.550.171',
                    'name': 'Discrete Mathematics'
                }
            }
        )

    def test_monday_12am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "12:00",
                    "section_type": "L",
                    "time_end": "12:50",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture), {
                3546: {
                    'time': '5/12 9-12',
                    'code': 'EN.550.171',
                    'name': 'Discrete Mathematics'
                }
            }
        )

    def test_monday_1_30pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "13:30",
                    "section_type": "L",
                    "time_end": "14:20",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture), {
                3546: {
                    'time': '5/11 9-12',
                    'code': 'EN.550.171',
                    'name': 'Discrete Mathematics'
                }
            }
        )

    def test_monday_3pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "15:00",
                    "section_type": "L",
                    "time_end": "15:50",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/13 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_monday_4_30pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "16:30",
                    "section_type": "L",
                    "time_end": "17:20",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/16 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_monday_6pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "18:00",
                    "section_type": "L",
                    "time_end": "18:50",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/15 6-9',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_wednesday_6pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "12:00",
                    "section_type": "L",
                    "time_end": "12:50",
                    "day": "R",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "18:00",
                    "section_type": "L",
                    "time_end": "18:50",
                    "day": "F",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "18:00",
                    "section_type": "L",
                    "time_end": "18:50",
                    "day": "W",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "18:00",
                    "section_type": "L",
                    "time_end": "18:50",
                    "day": "M",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/15 6-9',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_9am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "name": "Discrete Mathematics",
                "id": "3546",
                "slots": [{
                    "time_start": "12:00",
                    "section_type": "L",
                    "time_end": "12:50",
                    "day": "R",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "9:00",
                    "section_type": "L",
                    "time_end": "9:50",
                    "day": "F",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "9:00",
                    "section_type": "L",
                    "time_end": "9:50",
                    "day": "W",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "9:00",
                    "section_type": "L",
                    "time_end": "9:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }]
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/12 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_10_30am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "10:30",
                    "section_type": "L",
                    "time_end": "11:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/13 9-12',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_12am(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "12:00",
                    "section_type": "L",
                    "time_end": "13:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/17 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_1_30pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "13:30",
                    "section_type": "L",
                    "time_end": "16:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/18 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_3pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "15:00",
                    "section_type": "L",
                    "time_end": "15:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }

        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/11 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_4_30pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "16:30",
                    "section_type": "L",
                    "time_end": "17:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/15 2-5',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_tuesday_6pm(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "id": "3546",
                "name": "Discrete Mathematics",
                "slots": [{
                    "time_start": "18:00",
                    "section_type": "L",
                    "time_end": "20:50",
                    "day": "T",
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "semester": {"name": "Spring", "year": "2017"}
                }, ],
            }]
        }
        self.assertDictEqual(SCHEDULER.make_schedule(fixture), {
            3546: {
                'time': '5/16 6-9',
                'code': 'EN.550.171',
                'name': 'Discrete Mathematics',
            }
        })

    def test_multiple_courses(self):
        fixture = {
            "courses": [{
                "code": "EN.550.171",
                "num_credits": 4,
                "name": "Discrete Mathematics",
                "textbooks": {
                    "(06)": []
                },
                "department": "EN Applied Mathematics & Statistics",
                "slots": [{
                    "time_start": "12:00",
                    "waitlist": -1,
                    "meeting_section": "(06)",
                    "section": 6874,
                    "instructors": "B. Castello",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "12:50",
                    "waitlist_size": -1,
                    "course": 3297,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8047,
                    "day": "R",
                    "size": 25,
                    "colourId": 0,
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "10:00",
                    "waitlist": -1,
                    "meeting_section": "(06)",
                    "section": 6874,
                    "instructors": "B. Castello",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "10:50",
                    "waitlist_size": -1,
                    "course": 3297,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8046,
                    "day": "F",
                    "size": 25,
                    "colourId": 0,
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "10:00",
                    "waitlist": -1,
                    "meeting_section": "(06)",
                    "section": 6874,
                    "instructors": "B. Castello",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "10:50",
                    "waitlist_size": -1,
                    "course": 3297,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8045,
                    "day": "W",
                    "size": 25,
                    "colourId": 0,
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "10:00",
                    "waitlist": -1,
                    "meeting_section": "(06)",
                    "section": 6874,
                    "instructors": "B. Castello",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "10:50",
                    "waitlist_size": -1,
                    "course": 3297,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8044,
                    "day": "M",
                    "size": 25,
                    "colourId": 0,
                    "code": "EN.550.171",
                    "name": "Discrete Mathematics",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }],
                "enrolled_sections": ["(06)"],
                "id": 3297
            }, {
                "code": "EN.660.310",
                "num_credits": 3,
                "name": "Case Studies in Business Ethics",
                "textbooks": {
                    "(02)": []
                },
                "department": "EN Entrepreneurship and Management",
                "slots": [{
                    "time_start": "08:30",
                    "waitlist": -1,
                    "meeting_section": "(02)",
                    "section": 7800,
                    "instructors": "I. Izenberg",
                    "section_type": "L",
                    "enrolment": 12,
                    "time_end": "09:45",
                    "waitlist_size": -1,
                    "course": 3560,
                    "semester": "S",
                    "location": "Croft Hall B32",
                    "textbooks": [],
                    "id": 8743,
                    "day": "W",
                    "size": 19,
                    "colourId": 3,
                    "code": "EN.660.310",
                    "name": "Case Studies in Business Ethics",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "08:30",
                    "waitlist": -1,
                    "meeting_section": "(02)",
                    "section": 7800,
                    "instructors": "I. Izenberg",
                    "section_type": "L",
                    "enrolment": 12,
                    "time_end": "09:45",
                    "waitlist_size": -1,
                    "course": 3560,
                    "semester": "S",
                    "location": "Croft Hall B32",
                    "textbooks": [],
                    "id": 8742,
                    "day": "M",
                    "size": 19,
                    "colourId": 3,
                    "code": "EN.660.310",
                    "name": "Case Studies in Business Ethics",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }],
                "enrolled_sections": ["(02)"],
                "id": 3560
            }, {
                "code": "AS.110.107",
                "num_credits": 4,
                "name": "Calculus II (For Biological and Social Science)",
                "textbooks": {
                    "(08)": []
                },
                "department": "AS Mathematics",
                "slots": [{
                    "time_start": "13:30",
                    "waitlist": -1,
                    "meeting_section": "(08)",
                    "section": 1653,
                    "instructors": "V. Lorman",
                    "section_type": "L",
                    "enrolment": 30,
                    "time_end": "14:20",
                    "waitlist_size": -1,
                    "course": 800,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 4447,
                    "day": "R",
                    "size": 30,
                    "colourId": 2,
                    "code": "AS.110.107",
                    "name": "Calculus II (For Biological and Social Science)",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "11:00",
                    "waitlist": -1,
                    "meeting_section": "(08)",
                    "section": 1653,
                    "instructors": "V. Lorman",
                    "section_type": "L",
                    "enrolment": 30,
                    "time_end": "11:50",
                    "waitlist_size": -1,
                    "course": 800,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 4446,
                    "day": "F",
                    "size": 30,
                    "colourId": 2,
                    "code": "AS.110.107",
                    "name": "Calculus II (For Biological and Social Science)",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "11:00",
                    "waitlist": -1,
                    "meeting_section": "(08)",
                    "section": 1653,
                    "instructors": "V. Lorman",
                    "section_type": "L",
                    "enrolment": 30,
                    "time_end": "11:50",
                    "waitlist_size": -1,
                    "course": 800,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 4445,
                    "day": "W",
                    "size": 30,
                    "colourId": 2,
                    "code": "AS.110.107",
                    "name": "Calculus II (For Biological and Social Science)",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "11:00",
                    "waitlist": -1,
                    "meeting_section": "(08)",
                    "section": 1653,
                    "instructors": "V. Lorman",
                    "section_type": "L",
                    "enrolment": 30,
                    "time_end": "11:50",
                    "waitlist_size": -1,
                    "course": 800,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 4444,
                    "day": "M",
                    "size": 30,
                    "colourId": 2,
                    "code": "AS.110.107",
                    "name": "Calculus II (For Biological and Social Science)",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }],
                "enrolled_sections": ["(08)"],
                "id": 800
            }, {
                "code": "EN.550.436",
                "num_credits": 4,
                "name": "Data Mining",
                "textbooks": {
                    "(02)": []
                },
                "department": "EN Applied Mathematics & Statistics",
                "slots": [{
                    "time_start": "12:00",
                    "waitlist": -1,
                    "meeting_section": "(02)",
                    "section": 6914,
                    "instructors": "T. Budavari",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "12:50",
                    "waitlist_size": -1,
                    "course": 3315,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8193,
                    "day": "F",
                    "size": 25,
                    "colourId": 1,
                    "code": "EN.550.436",
                    "name": "Data Mining",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "12:00",
                    "waitlist": -1,
                    "meeting_section": "(02)",
                    "section": 6914,
                    "instructors": "T. Budavari",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "13:15",
                    "waitlist_size": -1,
                    "course": 3315,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8192,
                    "day": "W",
                    "size": 25,
                    "colourId": 1,
                    "code": "EN.550.436",
                    "name": "Data Mining",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }, {
                    "time_start": "12:00",
                    "waitlist": -1,
                    "meeting_section": "(02)",
                    "section": 6914,
                    "instructors": "T. Budavari",
                    "section_type": "L",
                    "enrolment": 25,
                    "time_end": "13:15",
                    "waitlist_size": -1,
                    "course": 3315,
                    "semester": "S",
                    "location": " ",
                    "textbooks": [],
                    "id": 8191,
                    "day": "M",
                    "size": 25,
                    "colourId": 1,
                    "code": "EN.550.436",
                    "name": "Data Mining",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }],
                "enrolled_sections": ["(02)"],
                "id": 3315
            }, {
                "code": "EN.600.411",
                "num_credits": 3,
                "name": "Computer Science Innovation & Entrepreneurship II",
                "textbooks": {
                    "(01)": []
                },
                "department": "EN Computer Science",
                "slots": [{
                    "time_start": "16:30",
                    "waitlist": -1,
                    "meeting_section": "(01)",
                    "section": 7315,
                    "instructors": "L. Aronhime, A. Dahbura",
                    "section_type": "L",
                    "enrolment": 12,
                    "time_end": "19:00",
                    "waitlist_size": -1,
                    "course": 3484,
                    "semester": "S",
                    "location": "Malone 107",
                    "textbooks": [],
                    "id": 8550,
                    "day": "T",
                    "size": 20,
                    "colourId": 4,
                    "code": "EN.600.411",
                    "name": "Computer Science Innovation & Entrepreneurship II",
                    "num_conflicts": 1,
                    "shift_index": 0,
                    "depth_level": 0,
                    "semester": {"name": "Spring", "year": "2017"}
                }],
                "enrolled_sections": ["(01)"],
                "id": 3484
            }],
            "num_conflicts": 0,
            "days_with_class": 5,
            "time_on_campus": 41.2,
            "avg_rating": 0,
            "num_friends": 0
        }
        self.assertDictEqual(
            SCHEDULER.make_schedule(fixture), {
                3560: {
                    'code': 'EN.660.310',
                    'name': 'Case Studies in Business Ethics',
                    'time': '5/18 9-12'
                },
                3297: {
                    'code': 'EN.550.171',
                    'name': 'Discrete Mathematics',
                    'time': '5/16 9-12'
                },
                3315: {
                    'code': 'EN.550.436',
                    'name': 'Data Mining',
                    'time': '5/12 9-12'
                },
                3484: {
                    'code': 'EN.600.411',
                    'name': 'Computer Science Innovation & Entrepreneurship II',
                    'time': '5/15 2-5'
                },
                800: {
                    'code': 'AS.110.107',
                    'name': 'Calculus II (For Biological and Social Science)',
                    'time': '5/10 9-12'
                }
            })