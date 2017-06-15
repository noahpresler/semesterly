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
from timetable.utils import update_locked_sections, courses_to_timetables
from helpers.mixins import ValidateSubdomainMixin, FeatureFlowView, CsrfExemptMixin

hashids = Hashids(salt="***REMOVED***")
logger = logging.getLogger(__name__)


class TimetableView(CsrfExemptMixin, ValidateSubdomainMixin, APIView):
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
                update_locked_sections(locked_sections, cid, locked_section)

        # temp optional course implementation
        opt_course_ids = params.get('optionCourses', [])
        max_optional = params.get('numOptionCourses', len(opt_course_ids))
        optional_courses = [Course.objects.get(id=cid) for cid in opt_course_ids]
        optional_course_subsets = [subset for k in range(max_optional, -1, -1)
                                   for subset in itertools.combinations(optional_courses, k)]

        custom_events = params.get('customSlots', [])
        preferences = params['preferences']
        with_conflicts = preferences.get('try_with_conflicts', False)
        sort_metrics = [(m['metric'], m['order']) for m in preferences.get('sort_metrics', [])
                        if m['selected']]

        result = [timetable for opt_courses in optional_course_subsets
                  for timetable in courses_to_timetables(courses + list(opt_courses), locked_sections, params['semester'], sort_metrics, params['school'], custom_events, with_conflicts, opt_course_ids)]

        # updated roster object
        response = {'timetables': result, 'new_c_to_s': locked_sections}
        return Response(response, status=status.HTTP_200_OK)


class TimetableLinkView(FeatureFlowView):
    feature_name = 'SHARE_TIMETABLE'

    def get_feature_flow(self, request, slug):
        timetable_id = hashids.decrypt(slug)[0]
        shared_timetable_obj = get_object_or_404(SharedTimetable,
                                                 id=timetable_id,
                                                 school=request.subdomain)
        shared_timetable = convert_tt_to_dict(shared_timetable_obj, include_last_updated=False)

        return {'semester': shared_timetable_obj.semester, 'sharedTimetable': shared_timetable}

    def post(self, request):
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
