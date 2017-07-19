"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

import operator

from django.db.models import Q

from timetable.models import Course


def course_name_contains_token(token):
    """Check if course contains token, considering 'and' == '&'"""
    return (Q(code__icontains=token) |
            Q(name__icontains=token.replace("&", "and")) |
            Q(name__icontains=token.replace("and", "&")))


def get_course_matches(school, query, semester):
    """
    Returns all courses containing all tokens (tokenized by whitespace)
    in the query, considering 'and'==='&'. Searches only courses with 
    sections in the given semester, for the given school.
    """
    if query == "":
        return Course.objects.filter(school=school)

    query_tokens = query.split()
    course_name_contains_query = reduce(
        operator.and_, map(course_name_contains_token, query_tokens))
    return Course.objects.filter(
        Q(school=school) &
        course_name_contains_query &
        Q(section__semester=semester)
    ).distinct()
