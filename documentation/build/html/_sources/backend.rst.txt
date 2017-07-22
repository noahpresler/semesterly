.. _backend:


*****************
Backend Endpoints
*****************


Create timetables
-----------------

description
    This endpoint generates timetables

endpoint
    ``/get_timetables/``

view
    ``get_timetables``

request format example
    .. code-block:: python

        {
            "courseSections": {
                "6076": {                                           # course id
                    "P": "P0201"                                    # maps section type code to locked section
                },
                "6090": {}                                          # empty object if no locked sections
            },
            "customSlots": [],
            "numOptionCourses": 0,
            "optionCourses": [],
            "preferences": {
                "sort_metrics": [
                    {
                        "metric": "days with class",
                        "order": "least",
                        "selected": false
                    },
                    {
                        "metric": "number of conflicts",
                        "order": "least",
                        "selected": false
                    },
                    {
                        "metric": "time on campus",
                        "order": "least",
                        "selected": false
                    },
                    {
                        "metric": "course rating stars",
                        "order": "most",
                        "selected": false
                    }
                ],
                "try_with_conflicts": false
            },
            "school": "uoft",
            "semester": {
                "name": "Fall",
                "year": "2016"
            },
            "sid": "k#abILevGEL7vbhIYJwL&7!wl4tBVD",
            "updated_courses": [
                {
                    "course_id": 6090,
                    "section_codes": [                              # list of locked section codes
                        "P0201"
                    ]
                }
            ]
        }

response format
    .. code-block:: python

        {
            "new_c_to_s": {
                "6076": {
                    "P": "P0201"
                },
                "6090": {
                    "P": "P0201"
                }
            },
            "timetables": [
                {
                    "avg_rating": 0,
                    "courses": [
                        {
                            "code": "EMU150H1",
                            "department": "MUS",
                            "enrolled_sections": [
                                "P0201"
                            ],
                            "id": 6076,
                            "name": "Instrumental-Violin & Viola",
                            "num_credits": 0.17,
                            "slots": [
                                {
                                    "_semester": " ",
                                    "course": 6076,
                                    "day": "W",
                                    "enrolment": -1,
                                    "id": 26674,
                                    "instructors": "Rapoport",
                                    "location": "120",
                                    "meeting_section": "P0201",
                                    "section": 15726,
                                    "section_type": "P",
                                    "semester": 1,
                                    "size": -1,
                                    "textbooks": [],
                                    "time_end": "11:00",
                                    "time_start": "10:00",
                                    "waitlist": -1,
                                    "waitlist_size": -1
                                }
                            ],
                            "textbooks": {
                                "P0201": []
                            }
                        },
                        ...
                    ],
                    "days_with_class": 1,
                    "has_conflict": false,
                    "num_conflicts": 0,
                    "num_friends": 0,
                    "time_on_campus": 24.8
                }
            ]
        }

Create Timetable Share Link
---------------------------

description
    This endpoint creates a new share link and stores it in the db

endpoint
    ``/share/link``

view
    ``create_share_link``

request format example

response format


Load Share Timetable Link
-------------------------

description
    This endpoint looks up share link in the db

endpoint
    ``/share/[code]``

view
    ``share_timetable``

request format example

response format


Basic Course Search
-------------------

description
    This endpoint is used to search based on string query (main in search bar)

endpoint
    ``/search/[school]/[semester name]/[year]/[query]/``

view
    ``course_search``

request format example

response format


Advanced Course Search
----------------------

description
    This endpoint is used to do search from advanced search modal

endpoint
    ``/advanced_search/``

view
    ``advanced_course_search``

request format example

response format

