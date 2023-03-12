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
from django.db.models import Q, Count
from timetable.models import Course
from functools import reduce

abbreviations = {
    "ip" : ["Intermediate Programming", "Data Structures"],
    "ifp" : ["Introduction to Fiction and Poetry"],
    "oose" : ["Object Oriented Software Engineering"],
    "ds" : ["Data Structures"]

}

def search(school, query, semester):
    """Returns courses that are contained in the name from a query."""
    if query == "":
        return Course.objects.filter(school=school)
    query_tokens = query.strip().lower().split()
    course_name_contains_query = reduce(
        operator.and_, map(course_name_contains_token, query_tokens)
    )
    """add the abbreviation here"""
    return (
        Course.objects.filter(
            Q(school=school)
            & (course_name_contains_query )
            & Q(section__semester=semester)
        )
        .annotate(id_count=Count("id"))
        .order_by("id")
    )


def query_is_abbreviation(query):
    query = query.lower()
    if query not in abbreviations:
        return None
    return reduce(operator.or_, map(lambda n: Q(name=n), abbreviations[query]))


def course_name_contains_token(token):
    """Returns a query set of courses where tokens are contained in code or name."""
    return (
        Q(code__icontains=token)
        | Q(name__icontains=token.replace("&", "and"))
        | Q(name__icontains=token.replace("and", "&"))
    )
