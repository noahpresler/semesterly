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

import itertools
import logging

from django.shortcuts import get_object_or_404
from hashids import Hashids
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import SharedTimetable
from analytics.views import save_analytics_timetable
from courses.serializers import CourseSerializer
from student.utils import get_student
from timetable.serializers import DisplayTimetableSerializer
from timetable.models import Semester, Course, Section
from timetable.utils import update_locked_sections, courses_to_timetables, DisplayTimetable
from helpers.mixins import ValidateSubdomainMixin, FeatureFlowView, CsrfExemptMixin
from semesterly.settings import get_secret

hashids = Hashids(salt=get_secret('HASHING_SALT'))
logger = logging.getLogger(__name__)


class TimetableView(CsrfExemptMixin, ValidateSubdomainMixin, APIView):
    """
    This view is responsible for responding to any requests dealing with the
    generation of timetables and the satisfaction of constraits provided by
    the frontend/user.
    """
    def post(self, request):
        """Generate best timetables given the user's selected courses"""
        school = request.subdomain
        params = request.data
        student = get_student(request)

        try:
            params['semester'] = Semester.objects.get_or_create(**params['semester'])[0]
        except TypeError: # handle deprecated cached semesters from frontend
            params['semester'] = Semester.objects.get(name="Fall", year="2016") \
                if params['semester'] == "F" \
                else Semester.objects.get(name="Spring", year="2017")

        course_ids = params['courseSections'].keys()
        courses = [Course.objects.get(id=cid) for cid in course_ids]
        locked_sections = params['courseSections']

        save_analytics_timetable(courses, params['semester'], school, get_student(request))

        for updated_course in params.get('updated_courses', []):
            cid = str(updated_course['course_id'])
            locked_sections[cid] = locked_sections.get(cid, {})
            if cid not in course_ids:
                courses.append(Course.objects.get(id=int(cid)))

            for locked_section in filter(bool, updated_course['section_codes']):
                update_locked_sections(locked_sections, cid, locked_section, params['semester'])

        # temp optional course implementation
        opt_course_ids = params.get('optionCourses', [])
        max_optional = params.get('numOptionCourses', len(opt_course_ids))
        optional_courses = [Course.objects.get(id=cid) for cid in opt_course_ids]
        optional_course_subsets = [subset for subset_size in range(max_optional, -1, -1)
                                   for subset in itertools.combinations(optional_courses,
                                                                        subset_size)]

        custom_events = params.get('customSlots', [])
        preferences = params['preferences']
        with_conflicts = preferences.get('try_with_conflicts', False)
        sort_metrics = [(m['metric'], m['order']) for m in preferences.get('sort_metrics', [])
                        if m['selected']]

        # TODO move sorting to view level so that result is sorted
        timetables = [timetable for opt_courses in optional_course_subsets
                                for timetable in courses_to_timetables(courses + list(opt_courses),
                                                                       locked_sections,
                                                                       params['semester'],
                                                                       sort_metrics,
                                                                       params['school'],
                                                                       custom_events,
                                                                       with_conflicts,
                                                                       opt_course_ids)]

        context = {'semester': params['semester'], 'school': request.subdomain, 'student': student}
        courses = [course for course in courses + optional_courses]
        response = {
            'timetables': DisplayTimetableSerializer(timetables, many=True).data,
            'new_c_to_s': locked_sections,
            'courses': CourseSerializer(courses, context=context, many=True).data
        }
        return Response(response, status=status.HTTP_200_OK)


class TimetableLinkView(FeatureFlowView):
    """
    A subclass of :obj:`FeatureFlowView` (see :ref:`flows`) for the
    viewing of shared timetable links. Provides the logic for preloading
    the shared timetable into initData when a user hits the corresponding
    url. The frontend can then act on this data to load the shared timetable
    for viewing.

    Additionally, on POST provides the functionality for the creation of
    shared timetables.
    """

    feature_name = 'SHARE_TIMETABLE'

    def get_feature_flow(self, request, slug):
        """
        Overrides :obj:`FeatureFlowView` *get_feature_flow* method. Takes the slug,
        decrypts the hashed database id, and either retrieves the corresponding
        timetable or hits a 404.
        """
        timetable_id = hashids.decrypt(slug)[0]
        shared_timetable = get_object_or_404(SharedTimetable,
                                             id=timetable_id,
                                             school=request.subdomain)
        context = {'semester': shared_timetable.semester, 'school': request.subdomain,
                   'student': get_student(request)}
        return {
            'semester': shared_timetable.semester,
            'courses': CourseSerializer(shared_timetable.courses, context=context, many=True).data,
            'sharedTimetable': DisplayTimetableSerializer.from_model(shared_timetable).data
        }

    def post(self, request):
        """
        Creates a :obj:`SharedTimetable` and returns the hashed database id
        as the slug for the url which students then share and access.
        """
        school = request.subdomain
        timetable = request.data['timetable']
        has_conflict = timetable.get('has_conflict', False)
        semester, _ = Semester.objects.get_or_create(**request.data['semester'])
        student = get_student(request)
        shared_timetable = SharedTimetable.objects.create(
            student=student, school=school, semester=semester,
            has_conflict=has_conflict)
        shared_timetable.save()

        added_courses = set()
        for slot in timetable['slots']:
            course_id, section_id = slot['course'], slot['section']
            if course_id not in added_courses:
                course_obj = Course.objects.get(id=course_id)
                shared_timetable.courses.add(course_obj)
                added_courses.add(course_id)

            section_obj = Section.objects.get(id=section_id)
            shared_timetable.sections.add(section_obj)
            if section_obj.course.id not in added_courses:
                return Response(status=status.HTTP_400_BAD_REQUEST)
        shared_timetable.save()

        response = {'slug': hashids.encrypt(shared_timetable.id)}
        return Response(response, status=status.HTTP_200_OK)
