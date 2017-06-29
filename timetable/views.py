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
from timetable.serializers import convert_tt_to_dict, DisplayTimetableSerializer
from timetable.models import Semester, Course, Section
from timetable.utils import update_locked_sections, courses_to_timetables
from helpers.mixins import ValidateSubdomainMixin, FeatureFlowView, CsrfExemptMixin

hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")
logger = logging.getLogger(__name__)


class TimetableView(CsrfExemptMixin, ValidateSubdomainMixin, APIView):
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
                update_locked_sections(locked_sections, cid, locked_section)

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
        result = [DisplayTimetableSerializer(timetable).data for opt_courses in optional_course_subsets
                  for timetable in courses_to_timetables(courses + list(opt_courses), locked_sections, params['semester'], sort_metrics, params['school'], custom_events, with_conflicts, opt_course_ids)]

        context = {'semester': params['semester'], 'school': request.subdomain, 'student': student}
        response = {
            'timetables': result,
            'new_c_to_s': locked_sections,
            'courses': [CourseSerializer(course, context=context).data
                        for course in courses + optional_courses]
        }
        return Response(response, status=status.HTTP_200_OK)


class TimetableLinkView(FeatureFlowView):
    feature_name = 'SHARE_TIMETABLE'

    def get_feature_flow(self, request, slug):
        timetable_id = hashids.decrypt(slug)[0]
        shared_timetable_obj = get_object_or_404(SharedTimetable,
                                                 id=timetable_id,
                                                 school=request.subdomain)
        shared_timetable = convert_tt_to_dict(shared_timetable_obj)

        return {'semester': shared_timetable_obj.semester, 'sharedTimetable': shared_timetable}

    def post(self, request):
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
            course_id, section_id = slot['course']['id'], slot['section']['id']
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
