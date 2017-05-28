import logging

from django.template.loader import get_template
from django.views.decorators.cache import never_cache
from django.shortcuts import get_object_or_404
from hashids import Hashids
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.views import *
from student.models import Student
from student.utils import convert_tt_to_dict
from timetable.utils import *
from timetable.utils import update_locked_sections, TimetableGenerator, ValidateSubdomainMixin, CsrfExemptMixin


hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")
logger = logging.getLogger(__name__)


def redirect_to_home(request):
    return HttpResponseRedirect("/")


def custom_404(request):
    # return HttpResponse("404", status=404)
    response = render(request, "404.html")
    # TODO, maybe add this next line back in when im done testing
    # response.status_code = 404
    return response


def custom_500(request):
    response = render_to_response('500.html')
    # TODO, maybe add this next line back in when im done testing
    # response.status_code = 500
    return response


def jhu_timer(request):
    return render(request, "jhu_timer.html")


def about(request):
    try:
        return render_to_response("about.html",
                                  {},
                                  context_instance=RequestContext(request))
    except Exception as e:
        return HttpResponse(str(e))


def press(request):
    try:
        return render_to_response("press.html",
                                  {},
                                  context_instance=RequestContext(request))
    except Exception as e:
        return HttpResponse(str(e))


@never_cache
def sw_js(request, js):
    template = get_template('sw.js')
    html = template.render()
    return HttpResponse(html, content_type="application/x-javascript")


def manifest_json(request, js):
    template = get_template('manifest.json')
    html = template.render()
    return HttpResponse(html, content_type="application/json")


@csrf_exempt
def log_final_exam_view(request):
    try:
        student = Student.objects.get(user=request.user)
    except:
        student = None
    FinalExamModalView.objects.create(
        student=student,
        school=request.subdomain
    ).save()
    return HttpResponse(json.dumps({}), content_type="application/json")


class TimetableView(CsrfExemptMixin, ValidateSubdomainMixin, APIView):
    def post(self, request):
        """Generate best timetables given the user's selected courses"""
        school = request.subdomain

        try:
            params = request.data
        except ValueError:  # someone is trying to manually send requests
            return HttpResponse(json.dumps({'timetables': [], 'new_c_to_s': {}}),
                                content_type='application/json')
        else:
            try:
                params['semester'] = Semester.objects.get_or_create(**params['semester'])[0]
            except TypeError:
                params['semester'] = Semester.objects.get(name="Fall", year="2016") \
                    if params['semester'] == "F" \
                    else Semester.objects.get(name="Spring", year="2017")

        sid = params['sid']
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
        optional_course_subsets = [subset for k in range(max_optional, -1, -1) \
                                   for subset in itertools.combinations(optional_courses, k)]

        custom_events = params.get('customSlots', [])
        generator = TimetableGenerator(params['semester'],
                                       params['school'],
                                       locked_sections,
                                       custom_events,
                                       params['preferences'],
                                       opt_course_ids)
        result = [timetable for opt_courses in optional_course_subsets \
                  for timetable in generator.courses_to_timetables(courses + list(opt_courses))]

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
