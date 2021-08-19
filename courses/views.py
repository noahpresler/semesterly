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

import collections
import json
from datetime import datetime

from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from django.template import RequestContext
from pytz import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import SharedCourseView
from courses.serializers import CourseSerializer
from student.models import Student
from student.utils import get_classmates_from_course_id
from timetable.models import Semester, Course
from timetable.school_mappers import SCHOOLS_MAP
from helpers.mixins import ValidateSubdomainMixin, FeatureFlowView
from helpers.decorators import validate_subdomain
from parsing.models import DataUpdate


# TODO: use CBV
@validate_subdomain
def all_courses(request):
    """
    Generates the full course directory page. Includes links to all courses
    and is sorted by department.
    """
    school = request.subdomain
    school_name = SCHOOLS_MAP[school].name  # TODO: use single groupby query
    dep_to_courses = collections.OrderedDict()
    departments = Course.objects.filter(school=school) \
        .order_by('department').values_list('department', flat=True).distinct()
    for department in departments:
        dep_to_courses[department] = Course.objects.filter(school=school,
                                                           department=department).all()
    context = {
        'course_map': dep_to_courses,
        'school': school,
        'school_name': school_name}
    return render(request, "all_courses.html", context)


# TODO: use implementation in student
# TODO: should send along with course response
def get_classmates_in_course(request, school, sem_name, year, course_id):
    """
    Finds all classmates for the authenticated user who also have a
    timetable with the given course.
    """
    school = school.lower()
    sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
    json_data = {'current': [], 'past': []}
    course = Course.objects.get(school=school, id=course_id)
    student = None
    is_logged_in = request.user.is_authenticated
    if is_logged_in and Student.objects.filter(user=request.user).exists():
        student = Student.objects.get(user=request.user)
    if student and student.user.is_authenticated and student.social_courses:
        json_data = get_classmates_from_course_id(
            school, student, course.id, sem)
    return HttpResponse(json.dumps(json_data), content_type="application/json")


# TODO delete or rewrite as CBV
@validate_subdomain
def course_page(request, code):
    """
    Generates a static course page for the provided course code and
    school (via subdomain). Completely outside of the React framework
    purely via Django templates.
    """
    school = request.subdomain
    try:
        school_name = SCHOOLS_MAP[school].name
        course_obj = Course.objects.filter(code__iexact=code)[0]
        # TODO: hard coding (section type, semester)
        current_year = datetime.now().year
        semester, _ = Semester.objects.get_or_create(
            name='Fall', year=current_year)
        course_dict = CourseSerializer(course_obj,
                                       context={'semester': semester, 'school': school}).data
        l = list(course_dict['sections'].get('L', {}).values())
        t = list(course_dict['sections'].get('T', {}).values())
        p = list(course_dict['sections'].get('P', {}).values())
        avg = round(course_obj.get_avg_rating(), 2)
        evals = course_dict['evals']
        clean_evals = evals
        for i, v in enumerate(evals):
            for k, e in list(v.items()):
                if isinstance(evals[i][k], str):
                    clean_evals[i][k] = evals[i][k].replace('\xa0', ' ')
                if k == "year":
                    clean_evals[i][k] = evals[i][k].replace(":", " ")
        if school == "jhu":
            course_url = "/course/" + course_dict['code'] + "/F"
        else:
            course_url = "/course/" + course_dict['code'] + "/F"
        context = {
            'school': school,
            'school_name': school_name,
            'course': course_dict,
            'lectures': l if l else None,
            'tutorials': t if t else None,
            'practicals': p if p else None,
            'url': course_url,
            'evals': clean_evals,
            'avg': avg
        }
        return render(request, "course_page.html", context)
    except Exception as e:
        return HttpResponse(str(e))


class CourseDetail(ValidateSubdomainMixin, APIView):
    """View that handles individual course entities."""

    def get(self, request, sem_name, year, course_id):
        """ Return detailed data about a single course. Currently used for course modals. """
        school = request.subdomain
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        course = get_object_or_404(Course, school=school, id=course_id)
        student = None
        is_logged_in = request.user.is_authenticated
        if is_logged_in and Student.objects.filter(user=request.user).exists():
            student = Student.objects.get(user=request.user)
        json_data = CourseSerializer(course,
                                     context={'semester': sem, 'student': student,
                                              'school': request.subdomain})
        return Response(json_data.data, status=status.HTTP_200_OK)


def get_distinct_areas(areas_group):
    distinct_areas = []
    for group in areas_group:
        if group != list('None'):
            for area in group:
                    distinct_areas.append(area)
    return set(distinct_areas)

class SchoolList(APIView):
    def get(self, request, school):
        """
        Provides the basic school information including the schools
        areas, departments, levels, and the time the data was last updated
        """
        # TODO - last_updated should encode per-semester last updated statuses
        last_updated = DataUpdate.objects.filter(
            school=school,
            update_type=DataUpdate.COURSES
        ).order_by('timestamp').last()

        if last_updated is not None:
            last_updated = '{} {}'.format(
                last_updated.timestamp.strftime('%Y-%m-%d %H:%M'),
                last_updated.timestamp.tzname()
            )

        json_data = {
            'areas': get_distinct_areas(sorted(list(Course.objects.filter(school=school)
                                             .exclude(areas__exact=[])
                                             .values_list('areas', flat=True)
                                             .distinct()))),
            'departments': sorted(list(Course.objects.filter(school=school)
                                       .exclude(department__exact='')
                                       .values_list('department', flat=True)
                                       .distinct())),
            'levels': sorted(list(Course.objects.filter(school=school)
                                  .exclude(level__exact='')
                                  .values_list('level', flat=True)
                                  .distinct())),
            'last_updated': last_updated
        }

        return Response(json_data, status=status.HTTP_200_OK)


class CourseModal(FeatureFlowView):
    """
    A :obj:`FeatureFlowView` for loading a course share link
    which directly opens the course modal on the frontend. Therefore,
    this view overrides the *get_feature_flow* method to fill intData
    with the detailed course json for the modal.abs

    Saves a :obj:`SharedCourseView` for analytics purposes.
    """

    feature_name = "SHARE_COURSE"

    def get_feature_flow(self, request, code, sem_name, year):
        semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        code = code.upper()
        course = get_object_or_404(Course, school=self.school, code=code)
        course_json = CourseSerializer(course,
                                       context={'semester': semester, 'school': self.school,
                                                'student': self.student})

        # analytics
        SharedCourseView.objects.create(
            student=self.student,
            shared_course=course,
        ).save()

        return {'sharedCourse': course_json.data, 'semester': semester}
