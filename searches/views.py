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

from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.views import save_analytics_course_search
from courses.serializers import get_detailed_course_json, get_basic_course_json
from searches.utils import get_course_matches
from student.models import Student
from student.utils import get_student
from timetable.models import Semester
from helpers.mixins import ValidateSubdomainMixin, CsrfExemptMixin


class CourseSearchList(CsrfExemptMixin, ValidateSubdomainMixin, APIView):

    def get(self, request, query, sem_name, year):
        """ Return basic search results. """
        sem = Semester.objects.get_or_create(name=sem_name, year=year)[0]
        course_match_objs = get_course_matches(request.subdomain, query, sem)[:4]
        save_analytics_course_search(query[:200], course_match_objs[:2], sem, request.subdomain,
                                     get_student(request))
        course_matches = [get_basic_course_json(course, sem) for course in course_match_objs]
        return Response(course_matches, status=status.HTTP_200_OK)

    def post(self, request, query, sem_name, year):
        """ Return advanced search results. """
        school = request.subdomain
        page = int(request.query_params.get('page', 1))
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        # Filter first by the user's search query.
        course_match_objs = get_course_matches(school, query, sem)

        # Filter now by departments, areas, levels, or times if provided.
        filters = request.data.get('filters', {})
        if filters.get('areas'):
            course_match_objs = course_match_objs.filter(areas__in=filters.get('areas'))
        if filters.get('departments'):
            course_match_objs = course_match_objs.filter(department__in=filters.get('departments'))
        if filters.get('levels'):
            course_match_objs = course_match_objs.filter(level__in=filters.get('levels'))
        if filters.get('times'):
            day_map = {"Monday": "M", "Tuesday": "T", "Wednesday": "W", "Thursday": "R", "Friday": "F"}
            course_match_objs = course_match_objs.filter(
                reduce(operator.or_, (Q(section__offering__time_start__gte="{0:0=2d}:00".format(min_max['min']),
                                        section__offering__time_end__lte="{0:0=2d}:00".format(min_max['max']),
                                        section__offering__day=day_map[min_max['day']],
                                        section__semester=sem,
                                        section__section_type="L") for min_max in filters.get('times'))
                       )
            )
        try:
            paginator = Paginator(course_match_objs.distinct(), 20)
            course_match_objs = paginator.page(page)
        except EmptyPage:
            return Response([])

        save_analytics_course_search(query[:200], course_match_objs[:2], sem, school,
                                     get_student(request),
                                     advanced=True)
        student = None
        logged = request.user.is_authenticated()
        if logged and Student.objects.filter(user=request.user).exists():
            student = Student.objects.get(user=request.user)
        json_data = [get_detailed_course_json(request.subdomain, course, sem, student) for course in
                     course_match_objs]

        return Response(json_data, status=status.HTTP_200_OK)
