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

import operator
from django.db.models import Q
from timetable.models import Course
from functools import reduce
from elasticsearch_dsl import Search


def baseline_search(school, query, semester):
    """Baseline search returns courses that are contained in the name from a query (legacy code)."""
    if query == "":
        return Course.objects.filter(school=school)
    query_tokens = query.strip().lower().split()
    course_name_contains_query = reduce(operator.and_, list(map(course_name_contains_token, query_tokens)))
    return Course.objects.filter(
        Q(school=school) &
        course_name_contains_query &
        Q(section__semester=semester)
    )


def course_desc_contains_token(token):
    """Returns a query set of courses where tokens are contained in descriptions."""
    return Q(description__icontains=token)


def course_name_contains_token(token):
    """Returns a query set of courses where tokens are contained in code or name."""
    return (Q(code__icontains=token) |
            Q(name__icontains=token.replace("&", "and")) |
            Q(name__icontains=token.replace("and", "&")))


def glob_search(school, semester_id, query, _from=0, size=15):
    search = {
        "from": _from,
        "size": size,
        "query": {
            "bool": {
                "should": [
                    {
                        "match": {
                            "code": {
                                "query": query,
                                "boost": 6,
                            }
                        }
                    },
                    {
                        "match": {
                            "name": {
                                "query": query,
                                "boost": 2,
                                "fuzziness": 2
                            }
                        }
                    },
                    {
                        "match": {
                            "description": {
                                "query": query
                            }
                        }
                    },
                    {
                        "match": {
                            "instructors": {
                                "query": query,
                                "boost": 5
                            }
                        }
                    },
                    {
                        "match": {
                            "instructors": {
                                "query": query,
                                "fuzziness": 2,
                            }
                        }
                    },
                    {
                        "match": {
                            "department": {
                                "query": query
                            }
                        }
                    }
                ],
                "filter": [
                    {
                        "term": {
                            "semesters": semester_id
                        }
                    },
                    {
                        "term": {
                            "school": school
                        }
                    },
                ]
            }
        },
        "highlight": {
            "fields": {
                "name": {},
                "code": {}
            }
        }
    }

    # TODO - add a minimum_should_match

    return self.do_search(search)

def advanced_search(school, _from=0, size=50, **kwargs):
    # instructors
    # departments
    # levels
    # areas
    # day_times
    search = {
        "from": _from,
        "size": size,
        "query": {
            "bool": {
                "should": [],
                "must": [],
                "filter": [
                    {
                        "term": {
                            "school": schoool
                        }
                    }
                ]
            }
        }
    }

    search['query']['bool']

    return self.do_search(search)


def do_search(self, search):
    return Search(index=GlobSearchDocument._doc_type.index).from_dict(search).execute()