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
    "algo": ["Intro Algorithms"],
    "algos": ["Intro Algorithms"],
    "bmed": ["Biomedical Engineering and Design"],
    "cmm": ["Computational Molecular Medicine"],
    "conlaw": ["Constitutional Law"],
    "csf": ["Computer System Fundamentals"],
    "csie": [
        "Computer Science Innovation & Entrepreneurship I",
        "Computer Science Innovation & Entrepreneurship II",
    ],
    "cte": ["Cell and Tissue Engineering Lab"],
    "dads": ["Design and Analysis of Dynamical Systems"],
    "db": ["Databases"],
    "devgen": ["Developmental Genetics"],
    "dm": ["Discrete Mathematics", "Honors Discrete Mathematics"],
    "diffeq": ["Differential Equations and Applications"],
    "ds": ["Data Structures"],
    "dsf": ["Digital Systems Fundamentals"],
    "e&i": ["Electronics & Instrumentation"],
    "fbbc": ["Foundations of Brain, Behavior and Cognition"],
    "fpse": ["Functional Programming in Software Engineering"],
    "hci": ["Introduction to Human-Computer Interaction"],
    "hri": ["Human-Robot Interaction"],
    "icp": ["Introduction to Cognitive Psychology"],
    "ie": ["International Monetary Economics"],
    "ifp": [
        "Introduction to Fiction & Poetry I",
        "Introduction to Fiction & Poetry II",
    ],
    "ifp i": ["Introduction to Fiction & Poetry I"],
    "ifp ii": ["Introduction to Fiction & Poetry II"],
    "igec": ["Introduction to Global Environmental Change"],
    "iid": ["Issues in International Development"],
    "ime": ["International Monetary Economics"],
    "ip": ["Intermediate Programming"],
    "ir": ["Information Retrieval and Web Agents"],
    "lade": ["Linear Algebra and Differential Equations"],
    "linalg": ["Linear Algebra", "Honors Linear Algebra"],
    "linsig": ["Linear Signals and Systems"],
    "mbd": ["Mechanics-Based Design", "Mechanics Based Design Laboratory"],
    "me": ["Mastering Electronics"],
    "meb": ["Introduction to Chemical and Biological Process Analysis"],
    "mfcs": ["Mathematical Foundations for Computer Science"],
    "ml": ["Machine Learning"],
    "modsim": ["Biological Models and Simulations"],
    "modsims": ["Biological Models and Simulations"],
    "ochem": [
        "Introductory Organic Chemistry I",
        "Introductory Organic Chemistry Laboratory",
        "Organic Chemistry II",
        "Honors Organic Chemistry II",
        "Chemical Chirality: An Introduction in Organic Chem. Lab, Techniques",
        "Intermediate Organic Chemistry Laboratory",
    ],
    "oose": ["Object Oriented Software Engineering"],
    "orgo": [
        "Introductory Organic Chemistry I",
        "Introductory Organic Chemistry Laboratory",
        "Organic Chemistry II",
        "Honors Organic Chemistry II",
        "Chemical Chirality: An Introduction in Organic Chem. Lab, Techniques",
        "Intermediate Organic Chemistry Laboratory",
    ],
    "pchem": [
        "Physical Chemistry I",
        "Physical Chemistry II",
        "Physical Chemistry Instrumentation Laboratory I",
        "Physical Chemistry Instrumentation Laboratory II",
    ],
    "pebl": ["Protein Engineering and Biochemistry Lab"],
    "pebble": ["Protein Engineering and Biochemistry Lab"],
    "prob": ["Introduction to Probability"],
    "probstat": [
        "Probability & Statistics for the Physical and Information Sciences & Engineering"
        "Probability and Statistics for the Life Sciences"
    ],
    "prob/stat": [
        "Probability & Statistics for the Physical and Information Sciences & Engineering"
        "Probability and Statistics for the Life Sciences"
    ],
    "probstats": [
        "Probability & Statistics for the Physical and Information Sciences & Engineering"
        "Probability and Statistics for the Life Sciences"
    ],
    "prob/stats": [
        "Probability & Statistics for the Physical and Information Sciences & Engineering"
        "Probability and Statistics for the Life Sciences"
    ],
    "qal": ["Quantitative Analytical Laboratory"],
    "sboc": ["Systems Biology of the Cell"],
    "setp": ["Social Entrepreneurship Theory and Practice. Community Based Learning"],
    "sla": ["Second Language Acquisition"],
    "stad": ["Software Testing & Debugging"],
    "stat": ["Introduction to Statistics"],
    "statphys": ["Statistical Physics"],
    "stats": ["Introduction to Statistics"],
    "strucbio": ["Structural Biology of Cells"],
    "sysbio": ["Systems Biology of the Cell"],
    "syscon": ["Systems and Controls"],
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
