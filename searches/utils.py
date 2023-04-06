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
    "aap": ["Asian American Politics"],
    "ai": ["Artificial Intelligence"],
    "cmm": ["Computational Molecular Medicine"],
    "csf": ["Computer System Fundamentals"],
    "cte": ["Cell and Tissue Engineering Lab"],
    "dads": ["Design and Analysis of Dynamical Systems"],
    "ds": ["Data Structures"],
    "dsf": ["Digital Systems Fundamentals"],
    "e&i": ["Electronics & Instrumentation"],
    "fbbc": ["Foundations of Brain, Behavior and Cognition"],
    "fpse": ["Functional Programming in Software Engineering"],
    "hci": ["Introduction to Human-Computer Interaction"],
    "icp": ["Introduction to Cognitive Psychology"],
    "ie": ["International Monetary Economics"],
    "ifp": [
        "Introduction to Fiction & Poetry I",
        "Introduction to Fiction & Poetry II",
    ],
    "iid": ["Issues in International Development"],
    "ime": ["International Monetary Economics"],
    "ip": ["Intermediate Programming"],
    "lade": ["Linear Algebra and Differential Equations"],
    "linalg": ["Linear Algebra"],
    "macro": ["Elements of Macroeconomics"],
    "me": ["Mastering Electronics"],
    "mfcs": ["Mathematical Foundations for Computer Science"],
    "micro": ["Elements of Microeconomics"],
    "oose": ["Object Oriented Software Engineering"],
    "pebl": ["Protein Engineering and Biochemistry Lab"],
    "probstat": ["Probability and Statistics"],
    "sboc": ["Systems Biology of the Cell"],
    "stad": ["Software Testing & Debugging"],
    "uima": ["User Interfaces and Mobile Applications"],
}


def search(school, query, semester):
    """Returns courses that are contained in the name from a query.
    If the query is empty, returns all courses in the school.
    If the query is one of the hard-coded abbreviations, returns all of the courses
    corresponding to that abbreviation.
    Otherwise defaults to finding courses in which every word in the query is contained
    in the course name.
    """
    if query == "":
        return Course.objects.filter(school=school)
    query = query.strip().lower()
    try:
        db_query = reduce(operator.or_, map(lambda n: Q(name=n), abbreviations[query]))
    except KeyError:
        db_query = reduce(
            operator.and_, list(map(course_name_contains_token, query.split()))
        )

    return (
        Course.objects.filter(
            Q(school=school) & db_query & Q(section__semester=semester)
        )
        .annotate(id_count=Count("id"))
        .order_by("id")
    )


def course_name_contains_token(token):
    """Returns a query set of courses where tokens are contained in code or name."""
    return (
        Q(code__icontains=token)
        | Q(name__icontains=token.replace("&", "and"))
        | Q(name__icontains=token.replace("and", "&"))
    )
