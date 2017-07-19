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

import itertools
import logging

from django.shortcuts import get_object_or_404
from hashids import Hashids
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import SharedTimetable
from analytics.views import save_analytics_timetable
from student.utils import get_student
from timetable.serializers import convert_tt_to_dict
from timetable.models import Semester, Course
from timetable.utils import update_locked_sections, TimetableGenerator
from helpers.mixins import ValidateSubdomainMixin, FeatureFlowView, CsrfExemptMixin

hashids = Hashids(salt="***REMOVED***")
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
        optional_course_subsets = [subset for k in range(max_optional, -1, -1)
                                   for subset in itertools.combinations(optional_courses, k)]

        custom_events = params.get('customSlots', [])
        generator = TimetableGenerator(params['semester'],
                                       params['school'],
                                       locked_sections,
                                       custom_events,
                                       params['preferences'],
                                       opt_course_ids)
        result = [timetable for opt_courses in optional_course_subsets
                  for timetable in generator.courses_to_timetables(courses + list(opt_courses))]

        # updated roster object
        response = {'timetables': result, 'new_c_to_s': locked_sections}
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
        shared_timetable_obj = get_object_or_404(SharedTimetable,
                                                 id=timetable_id,
                                                 school=request.subdomain)
        shared_timetable = convert_tt_to_dict(shared_timetable_obj, include_last_updated=False)

        return {'semester': shared_timetable_obj.semester, 'sharedTimetable': shared_timetable}

    def post(self, request):
        """
        Creates a :obj:`SharedTimetable` and returns the hashed database id 
        as the slug for the url which students then share and access.
        """
        school = request.subdomain
        courses = request.data['timetable']['courses']
        has_conflict = request.data['timetable'].get('has_conflict', False)
        semester, _ = Semester.objects.get_or_create(**request.data['semester'])
        student = get_student(request)
        shared_timetable = SharedTimetable.objects.create(
            student=student, school=school, semester=semester,
            has_conflict=has_conflict)
        shared_timetable.save()

        for course in courses:
            course_obj = Course.objects.get(id=course['id'])
            shared_timetable.courses.add(course_obj)
            enrolled_sections = course['enrolled_sections']
            for section in enrolled_sections:
                section_obj = course_obj.section_set.get(meeting_section=section,
                                                         semester=semester)
                shared_timetable.sections.add(section_obj)
        shared_timetable.save()

        response = {'slug': hashids.encrypt(shared_timetable.id)}
        return Response(response, status=status.HTTP_200_OK)
