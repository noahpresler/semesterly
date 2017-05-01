import logging

from braces.views import CsrfExemptMixin
from django.template.loader import get_template
from django.views.decorators.cache import never_cache
from hashids import Hashids
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.views import *
from courses.views import get_detailed_course_json
from student.models import Student
from student.utils import convert_tt_to_dict
from timetable.school_mappers import final_exams_available
from timetable.utils import *
from timetable.utils import validate_subdomain, update_locked_sections, TimetableGenerator, \
  ValidateSubdomainMixin, get_current_semesters

SCHOOL = ""

hashids = Hashids(salt="***REMOVED***")
logger = logging.getLogger(__name__)


def redirect_to_home(request):
  return HttpResponseRedirect("/")

def custom_404(request):
  # return HttpResponse("404", status=404)
  response = render(request, "404.html")
  # TODO, maybe add this next line back in when im done testing
  #response.status_code = 404
  return response

def custom_500(request):
    response = render_to_response('500.html')
    # TODO, maybe add this next line back in when im done testing
    # response.status_code = 500
    return response


@validate_subdomain
def view_timetable(request, code=None, sem_name=None, year=None, shared_timetable=None, 
                  find_friends=False, enable_notifs=False, signup=False, user_acq=False,
                  gcal_callback=False, export_calendar=False, view_textbooks=False,
                  final_exams=False):
  school = request.subdomain
  student = get_student(request)
  course_json = None

  # get default semester info
  sem_dicts = get_current_semesters(school) # corresponds to allSemesters on frontend
  semester_index = 0 # corresponds to state.semesterIndex on frontend
  sem = Semester.objects.get(**sem_dicts[semester_index])

  if sem_name and year: # loading a share course link OR timetable share link
    sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
    sem_pair = {'name': sem.name, 'year': sem.year}
    if sem_pair not in sem_dicts:
      sem_dicts.append(sem_pair)
      semester_index = len(sem_dicts) - 1
    else:
      semester_index = sem_dicts.index(sem_pair)

  if code: # user is loading a share course link, since code was included
    code = code.upper()
    try:
      course = Course.objects.get(school=school, code=code)
      course_json = get_detailed_course_json(school, course, sem, student)
      SharedCourseView.objects.create(
        student = student,
        shared_course = course,
      ).save()
    except:
      raise Http404

  integrations = {'integrations': []}
  if student and student.user.is_authenticated():
    student.school = school
    student.save()
    for i in student.integrations.all():
      integrations['integrations'].append(i.name)
  return render_to_response("timetable.html", {
    'school': school,
    'student': json.dumps(get_user_dict(school, student, sem)),
    'semester': str(semester_index),
    'all_semesters': json.dumps(sem_dicts),
    'uses_12hr_time': school in AM_PM_SCHOOLS,
    'student_integrations': json.dumps(integrations),

    'course': json.dumps(course_json),
    'shared_timetable': json.dumps(shared_timetable),
    'find_friends': find_friends,
    'enable_notifs': enable_notifs,
    'signup': signup,
    'user_acq': user_acq,
    'gcal_callback': gcal_callback,
    'export_calendar': export_calendar,
    'view_textbooks': view_textbooks,
    'final_exams_supported_semesters': map(lambda s: sem_dicts.index(s) ,final_exams_available.get(school, [])),
    'final_exams': final_exams
  },
  context_instance=RequestContext(request))


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
    global SCHOOL
    SCHOOL = request.subdomain

    try:
      params = request.data
    except ValueError:  # someone is trying to manually send requests
      return HttpResponse(json.dumps({'timetables': [], 'new_c_to_s': {}}),
                          content_type='application/json')
    else:
      try:
        params['semester'] = Semester.objects.get_or_create(**params['semester'])[0]
      except TypeError:
        params['semester'] = Semester.objects.get(name="Fall", year="2016") if params[
                                                                                 'semester'] == "F" else Semester.objects.get(
          name="Spring", year="2017")

    sid = params['sid']
    course_ids = params['courseSections'].keys()
    courses = [Course.objects.get(id=cid) for cid in course_ids]
    locked_sections = params['courseSections']

    save_analytics_timetable(courses, params['semester'], SCHOOL, get_student(request))

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


class TimetableLinkView(ValidateSubdomainMixin, APIView):

  def get(self, request, slug):
    student = get_student(request)
    try:
      timetable_id = hashids.decrypt(slug)[0]
      shared_timetable_obj = SharedTimetable.objects.get(school=request.subdomain, id=timetable_id)
      shared_timetable = convert_tt_to_dict(shared_timetable_obj, include_last_updated=False)
      # get default semester info
      return view_timetable(request, year=shared_timetable_obj.semester.year,
                            sem_name=shared_timetable_obj.semester.name, shared_timetable=shared_timetable)
    except Exception as e:
      raise Http404

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