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

from django.core.paginator import Paginator
from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.views import save_analytics_course_search
from courses.serializers import CourseSerializer
from searches.utils import search
from student.utils import get_student
from timetable.models import Semester
from helpers.mixins import ValidateSubdomainMixin, CsrfExemptMixin
from functools import reduce


class CourseSearchList(CsrfExemptMixin, ValidateSubdomainMixin, APIView):
    """Course Search List."""

    def get(self, request, query, sem_name, year):
        """Return search results."""
        school = request.subdomain
        sem = Semester.objects.get_or_create(name=sem_name, year=year)[0]
        # grab first 10 results
        course_matches = search(request.subdomain, query, sem).distinct()[:10]
        self.save_analytic(request, query, course_matches, sem)
        course_match_data = [
            CourseSerializer(course, context={"semester": sem, "school": school}).data
            for course in course_matches
        ]
        return Response(course_match_data, status=status.HTTP_200_OK)

    def save_analytic(self, request, query, course_matches, sem, advanced=False):
        save_analytics_course_search(
            query[:200],
            course_matches[:2],
            sem,
            request.subdomain,
            get_student(request),
            advanced,
        )

    def post(self, request, query, sem_name, year):
        """Return advanced search results."""
        school = request.subdomain
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        filters = request.data.get("filters", {})
        course_matches = search(school, query, sem)
        course_matches = self.filter_course_matches(course_matches, filters, sem)
        course_matches = course_matches.distinct()[:100]  # prevent timeout
        self.save_analytic(request, query, course_matches, sem, True)
        student = get_student(request)
        serializer_context = {
            "semester": sem,
            "student": student,
            "school": request.subdomain,
        }
        cur_page = int(request.GET.get("page", 1))
        courses_per_page = int(request.GET.get("limit", 10))
        paginator = Paginator(course_matches, courses_per_page)
        if cur_page > paginator.num_pages:
            course_match_data = []
        else:
            paginated_data = paginator.page(cur_page)
            course_match_data = CourseSerializer(
                paginated_data, context=serializer_context, many=True
            ).data

        return Response(
            {"data": course_match_data, "page": cur_page}, status=status.HTTP_200_OK
        )

    def filter_course_matches(self, course_matches, filters, sem):
        course_matches = self.filter_by_areas(course_matches, filters)
        course_matches = self.filter_by_departments(course_matches, filters)
        course_matches = self.filter_by_levels(course_matches, filters)
        course_matches = self.filter_by_times(sem, course_matches, filters)
        course_matches = course_matches.order_by("id")
        return course_matches

    def filter_by_areas(self, course_matches, filters):
        if filters.get("areas"):
            course_matches = course_matches.filter(areas__contains=filters.get("areas"))
        return course_matches

    def filter_by_departments(self, course_matches, filters):
        if filters.get("departments"):
            course_matches = course_matches.filter(
                department__in=filters.get("departments")
            )
        return course_matches

    def filter_by_levels(self, course_matches, filters):
        if filters.get("levels"):
            course_matches = course_matches.filter(level__in=filters.get("levels"))
        return course_matches

    def filter_by_times(self, sem, course_matches, filters):
        if filters.get("times"):
            day_map = {
                "Monday": "M",
                "Tuesday": "T",
                "Wednesday": "W",
                "Thursday": "R",
                "Friday": "F",
                "Saturday": "S",
                "Sunday": "U",
            }
            course_matches = course_matches.filter(
                reduce(
                    operator.or_,
                    (
                        Q(
                            section__offering__time_start__gte="{0:0=2d}:00".format(
                                min_max["min"]
                            ),
                            section__offering__time_end__lte="{0:0=2d}:00".format(
                                min_max["max"]
                            ),
                            section__offering__day=day_map[min_max["day"]],
                            section__semester=sem,
                            section__section_type="L",
                        )
                        for min_max in filters.get("times")
                    ),
                )
            )
        return course_matches
