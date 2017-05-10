import collections
import itertools
import json
import re
from pytz import timezone
from datetime import datetime

from django.db.models import Count
from django.forms import model_to_dict
from django.http import HttpResponse
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from analytics.models import SharedCourseView
from student.models import PersonalTimetable, Student
from student.utils import get_classmates_from_course_id
from timetable.models import Evaluation, Section, Semester, Course, Updates
from timetable.school_mappers import school_to_course_regex, school_code_to_name
from timetable.utils import validate_subdomain, ValidateSubdomainMixin, FeatureFlowView


def get_detailed_course_json(school, course, sem, student=None):
    json_data = get_basic_course_json(course, sem, ['prerequisites', 'exclusions', 'areas'])
    json_data['eval_info'] = eval_add_unique_term_year_flag(course, course.get_eval_info())
    json_data['related_courses'] = course.get_related_course_info(sem, limit=5)
    json_data['reactions'] = course.get_reactions(student)
    json_data['textbooks'] = course.get_textbooks(sem)
    json_data['integrations'] = list(course.get_course_integrations())
    json_data['regexed_courses'] = get_regexed_courses(school, json_data)
    json_data['popularity_percent'] = get_percentage_enrolled(course, sem)
    return json_data


def eval_add_unique_term_year_flag(course, evals):
    """
    Flag all eval instances s.t. there exists repeated term+year values.
    Return:
      List of modified evaluation dictionaries (added flag 'unique_term_year')
    """
    years = Evaluation.objects.filter(course=course).values('year').annotate(Count('id')).filter(
        id__count__gt=1).values_list('year')
    years = {e[0] for e in years}
    for course_eval in evals:
        course_eval['unique_term_year'] = not course_eval['year'] in years
    return evals


def get_percentage_enrolled(course, sem):
    """ Return percentage of course capacity that is filled. """
    num_students_in_course = PersonalTimetable.objects.filter(courses__in=[course], semester=sem) \
        .values('student').distinct().count()
    course_capacity = sum(Section.objects.filter(course=course, semester=sem)
                          .values_list('size', flat=True))
    try:
        return num_students_in_course / float(course_capacity)
    except ZeroDivisionError:
        return 0


def get_basic_course_json(course, sem, extra_model_fields=None):
    extra_model_fields = extra_model_fields or []
    basic_fields = 'code name id description department num_credits areas campus'.split()
    course_json = model_to_dict(course, basic_fields + extra_model_fields)
    course_json['evals'] = course.get_eval_info()
    course_json['integrations'] = list(course.get_course_integrations())
    course_json['sections'] = {}

    course_section_list = sorted(course.section_set.filter(semester=sem),
                                 key=lambda section: section.section_type)

    # TODO: flatten dictionary with one key
    for section_type, sections in itertools.groupby(course_section_list, lambda s: s.section_type):
        course_json['sections'][section_type] = {
            section.meeting_section: get_section_offerings(section) for section in sections
        }

    return course_json


def get_section_offerings(section):
    """ Return a list of model dicts of each offering of a section. """
    return [dict(model_to_dict(co), **model_to_dict(section)) for co in section.offering_set.all()]


def get_regexed_courses(school, course_data):
    """
    Given course data, search for all occurrences of a course code in the course description and
    prereq info and return a map from course code to course name for each course code.
    """
    course_code_to_name = {}
    if school in school_to_course_regex:
        course_code_matches = re.findall(school_to_course_regex[school],
                                         course_data['description'] + course_data['prerequisites'])
        # TODO: get all course objects in one db access
        for course_code in course_code_matches:
            try:
                course_code_to_name[course_code] = Course.objects.get(school=school,
                                                                      code__icontains=course_code)
            except (Course.DoesNotExist, Course.MultipleObjectsReturned):
                pass
    return course_code_to_name


# TODO: use CBV
@validate_subdomain
def all_courses(request):
    school = request.subdomain
    school_name = school_code_to_name[school]  # TODO: use single groupby query
    dep_to_courses = collections.OrderedDict()
    departments = Course.objects.filter(school=school) \
        .order_by('department').values_list('department', flat=True).distinct()
    for department in departments:
        dep_to_courses[department] = Course.objects.filter(school=school,
                                                           department=department).all()
    context = {'course_map': dep_to_courses, 'school': school, 'school_name': school_name}
    return render_to_response("all_courses.html",
                              context,
                              context_instance=RequestContext(request))


# TODO: use implementation in student
def get_classmates_in_course(request, school, sem_name, year, course_id):
    school = school.lower()
    sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
    json_data = {}
    course = Course.objects.get(school=school, id=course_id)
    student = None
    logged = request.user.is_authenticated()
    if logged and Student.objects.filter(user=request.user).exists():
        student = Student.objects.get(user=request.user)
    if student and student.user.is_authenticated() and student.social_courses:
        json_data = get_classmates_from_course_id(school, student, course.id, sem)
    return HttpResponse(json.dumps(json_data), content_type="application/json")


# TODO delete or rewrite as CBV
@validate_subdomain
def course_page(request, code):
    school = request.subdomain
    try:
        school_name = school_code_to_name[school]
        course_obj = Course.objects.filter(code__iexact=code)[0]
        # TODO: hard coding (section type, semester)
        current_year = datetime.now().year
        semester, _ = Semester.objects.get_or_create(name='Fall', year=current_year)
        course_dict = get_basic_course_json(course_obj, semester)
        l = course_dict['sections'].get('L', {}).values()
        t = course_dict['sections'].get('T', {}).values()
        p = course_dict['sections'].get('P', {}).values()
        avg = round(course_obj.get_avg_rating(), 2)
        evals = course_dict['evals']
        clean_evals = evals
        for i, v in enumerate(evals):
            for k, e in v.items():
                if isinstance(evals[i][k], basestring):
                    clean_evals[i][k] = evals[i][k].replace(u'\xa0', u' ')
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
        return render_to_response("course_page.html",
                                  context,
                                  context_instance=RequestContext(request))
    except Exception as e:
        return HttpResponse(str(e))


class CourseDetail(ValidateSubdomainMixin, APIView):
    def get(self, request, sem_name, year, course_id):
        school = request.subdomain
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        course = get_object_or_404(Course, school=school, id=course_id)
        student = None
        is_logged_in = request.user.is_authenticated()
        if is_logged_in and Student.objects.filter(user=request.user).exists():
            student = Student.objects.get(user=request.user)
        json_data = get_detailed_course_json(school, course, sem, student)
        return Response(json_data, status=status.HTTP_200_OK)


class SchoolList(APIView):
    def get(self, request, school):
        last_updated = None
        if Updates.objects.filter(school=school, update_field="Course").exists():
            update_time_obj = Updates.objects.get(school=school, update_field="Course") \
                .last_updated.astimezone(timezone('US/Eastern'))
            last_updated = update_time_obj.strftime(
                '%Y-%m-%d %H:%M') + " " + update_time_obj.tzname()
        json_data = {
            'areas': sorted(list(Course.objects.filter(school=school) \
                                 .exclude(areas__exact='') \
                                 .values_list('areas', flat=True) \
                                 .distinct())),
            'departments': sorted(list(Course.objects.filter(school=school) \
                                       .exclude(department__exact='') \
                                       .values_list('department', flat=True) \
                                       .distinct())),
            'levels': sorted(list(Course.objects.filter(school=school) \
                                  .exclude(level__exact='') \
                                  .values_list('level', flat=True) \
                                  .distinct())),
            'last_updated': last_updated
        }
        return Response(json_data, status=status.HTTP_200_OK)


class CourseModal(FeatureFlowView):
    feature_name = "SHARE_COURSE"

    def get_feature_flow(self, request, code, sem_name, year):
        semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        code = code.upper()
        course = get_object_or_404(Course, school=self.school, code=code)
        course_json = get_detailed_course_json(self.school, course, semester, self.student)

        # analytics
        SharedCourseView.objects.create(
            student=self.student,
            shared_course=course,
        ).save()

        return {'sharedCourse': course_json, 'semester': semester}
