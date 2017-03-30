import collections
import copy
from datetime import datetime
import functools
import itertools
import json
import logging
import operator
import os
from pprint import pprint
from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.db.models import Q, Count
from hashids import Hashids
from pytz import timezone

from analytics.models import *
from analytics.views import *
from timetable.models import *
from timetable.school_mappers import school_to_granularity, VALID_SCHOOLS, school_code_to_name, AM_PM_SCHOOLS, school_to_course_regex, school_to_semesters
from timetable.utils import *
from timetable.scoring import *
from timetable.jhu_final_exam_scheduler import *
from timetable.jhu_final_exam_test import *
from student.models import Student
from student.views import get_student, get_user_dict, convert_tt_to_dict, get_classmates_from_course_id



MAX_RETURN = 60 # Max number of timetables we want to consider

SCHOOL = ""

hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")
logger = logging.getLogger(__name__)
jhu_final_exam_scheduler = JHUFinalExamScheduler()

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
# ******************************************************************************
# ******************************** GENERATE TTs ********************************
# ******************************************************************************

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
    'course': json.dumps(course_json),
    'semester': str(semester_index),
    'all_semesters': json.dumps(sem_dicts),
    'shared_timetable': json.dumps(shared_timetable),
    'find_friends': find_friends,
    'enable_notifs': enable_notifs,
    'uses_12hr_time': school in AM_PM_SCHOOLS,
    'student_integrations': json.dumps(integrations),
    'signup': signup,
    'user_acq': user_acq,
    'gcal_callback': gcal_callback,
    'export_calendar': export_calendar,
    'view_textbooks': view_textbooks,
    'final_exams': final_exams
  },
  context_instance=RequestContext(request))

@validate_subdomain
def google_calendar_callback(request):
  try:
    return view_timetable(request, gcal_callback=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def view_final_exams(request):
  try:
    return view_timetable(request, final_exams=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def view_textbooks(request):
  try:
    return view_timetable(request, view_textbooks=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def export_calendar(request):
  try:
    return view_timetable(request, export_calendar=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def signup(request):
  try:
    return view_timetable(request, signup=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def launch_user_acq_modal(request):
  try:
    return view_timetable(request, user_acq=True)
  except Exception as e:
    raise Http404


@validate_subdomain
def find_friends(request):
  try:
    return view_timetable(request, find_friends=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def enable_notifs(request):
  try:
    return view_timetable(request, enable_notifs=True)
  except Exception as e:
    raise Http404

@validate_subdomain
def share_timetable(request, ref):
  try:
    timetable_id = hashids.decrypt(ref)[0]
    shared_timetable_obj = SharedTimetable.objects.get(
                                    school=request.subdomain, id=timetable_id)                
    shared_timetable = convert_tt_to_dict(shared_timetable_obj, include_last_updated=False)
    semester = shared_timetable_obj.semester
    return view_timetable(request, sem_name=semester.name, year=semester.year,
                                  shared_timetable=shared_timetable)
  except Exception as e:
    raise Http404

@csrf_exempt
@validate_subdomain
def create_share_link(request):
  school = request.subdomain
  params = json.loads(request.body)
  courses = params['timetable']['courses']
  try:
    has_conflict = params['timetable']['has_conflict']
  except:
    has_conflict = False
  semester, _ = Semester.objects.get_or_create(**params['semester'])
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

  response = {'link': hashids.encrypt(shared_timetable.id)}
  return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
def get_timetables(request):
  """Generate best timetables given the user's selected courses"""
  global SCHOOL

  try:
    params = json.loads(request.body)
  except ValueError: # someone is trying to manually send requests
    return HttpResponse(json.dumps({'timetables': [], 'new_c_to_s': {}}), 
                        content_type='application/json')
  else:
    try:
      params['semester'] = Semester.objects.get_or_create(**params['semester'])[0]
    except TypeError: 
      params['semester'] = Semester.objects.get(name="Fall",year="2016") if params['semester'] == "F" else Semester.objects.get(name="Spring",year="2017")


  SCHOOL = request.subdomain

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
  optional_course_subsets = [subset for k in range(max_optional, -1, -1)\
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
  return HttpResponse(json.dumps(response), content_type='application/json')

def update_locked_sections(locked_sections, cid, locked_section):
  """
  Take cid of new course, and locked section for that course
  and toggle its locked status (ie if was locked, unlock and vice versa.
  """
  section_type = Section.objects.filter(course=cid, meeting_section=locked_section)[0].section_type
  if locked_sections[cid].get(section_type, '') == locked_section: # already locked
    locked_sections[cid][section_type] = '' # unlock that section_type
  else: # add as locked section for that section_type
    locked_sections[cid][section_type] = locked_section

class TimetableGenerator:
  def __init__(self,
                semester,
                school,
                locked_sections,
                custom_events,
                preferences,
                optional_course_ids=[]):
    self.school = school
    self.slots_per_hour = 60 / school_to_granularity[school]
    self.semester = semester
    self.with_conflicts = preferences.get('try_with_conflicts', False)
    self.sort_metrics = [(m['metric'], m['order']) \
                            for m in preferences.get('sort_metrics', []) \
                              if m['selected']]
    self.locked_sections = locked_sections
    self.custom_events = custom_events
    self.optional_course_ids = optional_course_ids

  def courses_to_timetables(self, courses):
    all_offerings = self.courses_to_offerings(courses)
    timetables = self.create_timetable_from_offerings(all_offerings)
    timetables.sort(key=lambda tt: get_tt_cost(tt[1], self.sort_metrics))
    return map(self.convert_tt_to_dict, timetables)

  def convert_tt_to_dict(self, timetable):
    tt_obj = {}
    tt, tt_stats = timetable
    # get a course dict -> sections dictionary
    grouped = itertools.groupby(tt, self.get_basic_course_dict)
    # augment each course dict with its section/other info
    tt_obj['courses'] = list(itertools.starmap(self.augment_course_dict, grouped))
    return merge_dicts(tt_obj, tt_stats)

  def get_basic_course_dict(self, section):
    model = Course.objects.get(id=section[0])
    course_dict = model_to_dict(model, fields=['code', 'name', 'id', 'num_credits', 'department'])
    if section[0] in self.optional_course_ids: # mark optional courses
      course_dict['is_optional'] = True
    return course_dict

  def augment_course_dict(self, course_dict, sections):
    sections = list(sections)
    slot_objects = [merge_dicts(model_to_dict(section), model_to_dict(co))\
                           for _, section, course_offerings in sections
                           for co in course_offerings]
    course_dict['enrolled_sections'] = [section.meeting_section for _, section, _ in sections]
    course_dict['textbooks'] = {section.meeting_section: section.get_textbooks() for _, section, _ in sections}
    course_dict['slots'] = slot_objects
    return course_dict

  def create_timetable_from_offerings(self, offerings):
    timetables = []
    for timetable in self.offerings_to_timetables(offerings):
      if len(timetables) >= MAX_RETURN:
        break
      timetables.append(timetable)
    return timetables

  def offerings_to_timetables(self, sections):
    """
    Generate timetables in a depth-first manner based on a list of sections.
    sections: a list of sections, where each section is a list of offerings
          corresponding to that section. Each offering consists of three
          elements: the course id (the key in the course table), the meeting
          section code (meeting section in the courseoffering table), and a
          list of courseoffering objects which specify the times that the
          offering in question meets. An example section:
          [[27, 'L5101', [<CourseOffering>], [27, 'L1001', [<CourseOffering>]]]
    with_conflicts: True if you want to consider conflicts, False otherwise.
    """
    num_offerings, num_permutations_remaining = get_xproduct_indicies(sections)
    total_num_permutations = num_permutations_remaining.pop(0)
    for p in xrange(total_num_permutations): # for each possible tt
      current_tt = []
      day_to_usage = self.get_day_to_usage()
      num_conflicts = 0
      add_tt = True
      for i in xrange(len(sections)): # add an offering for the next section
        j = (p/num_permutations_remaining[i]) % num_offerings[i]
        num_added_conflicts = add_meeting_and_check_conflict(day_to_usage,
                                                              sections[i][j])
        num_conflicts += num_added_conflicts
        if num_conflicts and not self.with_conflicts:
          add_tt = False
          break
        current_tt.append(sections[i][j])
      if add_tt and len(current_tt) != 0:
        tt_stats = self.get_tt_stats(current_tt, day_to_usage)
        tt_stats['num_conflicts'] = num_conflicts
        tt_stats['has_conflict'] = bool(num_conflicts)
        yield (tuple(current_tt), tt_stats)

  def get_day_to_usage(self):
    """Initialize day_to_usage dictionary, which has custom events blocked out."""
    day_to_usage = {
      'M': [set() for i in range(14 * 60 / school_to_granularity[SCHOOL])],
      'T': [set() for i in range(14 * 60 / school_to_granularity[SCHOOL])],
      'W': [set() for i in range(14 * 60 / school_to_granularity[SCHOOL])],
      'R': [set() for i in range(14 * 60 / school_to_granularity[SCHOOL])],
      'F': [set() for i in range(14 * 60 / school_to_granularity[SCHOOL])]
    }

    for event in self.custom_events:
      for slot in find_slots_to_fill(event['time_start'], event['time_end']):
        day_to_usage[event['day']][slot].add('custom_slot')

    return day_to_usage

  def courses_to_offerings(self, courses, plist=[]):
    """
    Take a list of courses and group all of the courses' offerings by section
    type. Returns a list of lists (for each group), where e
    each offering is represented as a [course_id, section_code, [CourseOffering]]
    triple.
    """
    all_sections = []
    for c in courses:
      sections = c.section_set.filter(semester=self.semester)
      sections = sorted(sections, key=lambda s: s.section_type)
      grouped = itertools.groupby(sections, lambda s: s.section_type)
      for section_type, sections in grouped:
        if str(c.id) in self.locked_sections and self.locked_sections[str(c.id)].get(section_type, False):
          locked_section_code = self.locked_sections[str(c.id)][section_type]
          try:
            locked_section = next(s for s in sections if s.meeting_section == locked_section_code)
          except StopIteration:
            all_sections.append([[c.id, section, section.offering_set.all()] for section in sections])
          else:
            pinned = [c.id, locked_section, locked_section.offering_set.all()]
            all_sections.append([pinned])
        else:
          all_sections.append([[c.id, section, section.offering_set.all()] for section in sections])
    return all_sections

  def get_tt_stats(self, timetable, day_to_usage):
    return {
      'days_with_class': get_num_days(day_to_usage),
      'time_on_campus': get_avg_day_length(day_to_usage),
      'num_friends': get_num_friends(timetable),
      'avg_rating': get_avg_rating(timetable)
    }

def get_xproduct_indicies(lists):
  """
  Takes a list of lists and returns two lists of indicies needed to iterate
  through the cross product of the input.
  """
  num_offerings = []
  num_permutations_remaining = [1]
  for i in xrange(len(lists) - 1, -1, -1):
    length = len(lists[i])
    num_offerings.insert(0, length)
    num_permutations_remaining.insert(0, length * num_permutations_remaining[0])
  return num_offerings, num_permutations_remaining

def add_meeting_and_check_conflict(day_to_usage, new_meeting):
  """
  Takes a @day_to_usage dictionary and a @new_meeting section and
  returns a tuple of the updated day_to_usage dict and a boolean
  which is True if conflict, False otherwise.
  """
  course_offerings = new_meeting[2]
  new_conflicts = 0
  for offering in course_offerings:
    day = offering.day
    if day != 'U':
      for slot in find_slots_to_fill(offering.time_start, offering.time_end):
        previous_len = max(1, len(day_to_usage[day][slot]))
        day_to_usage[day][slot].add(offering)
        new_conflicts += len(day_to_usage[day][slot]) - previous_len
  return new_conflicts

def find_slots_to_fill(start, end):
  """
  Take a @start and @end time in the format found in the coursefinder (e.g. 9:00, 16:30),
  and return the indices of the slots in thet array which represents times from 8:00am
  to 10pm that would be filled by the given @start and @end. For example, for uoft
  input: '10:30', '13:00'
  output: [5, 6, 7, 8, 9]
  """
  start_hour, start_minute = get_hours_minutes(start)
  end_hour, end_minute = get_hours_minutes(end)

  return [i for i in range(get_time_index(start_hour, start_minute), get_time_index(end_hour, end_minute))]

def get_time_index(hours, minutes):
  """Take number of hours and minutes, and return the corresponding time slot index"""
  # earliest possible hour is 8, so we get the number of hours past 8am
  return (hours - 8) * (60 / school_to_granularity[SCHOOL]) + \
      minutes / school_to_granularity[SCHOOL]

def get_hours_minutes(time_string):
  """
  Return tuple of two integers representing the hour and the time
  given a string representation of time.
  e.g. '14:20' -> (14, 20)
  """
  return (get_hour_from_string_time(time_string),
    get_minute_from_string_time(time_string))

def get_hour_from_string_time(time_string):
  """Get hour as an int from time as a string."""
  return int(time_string[:time_string.index(':')]) if ':' in time_string \
                          else int(time_string)

def get_minute_from_string_time(time_string):
  """Get minute as an int from time as a string."""
  return int(time_string[time_string.index(':') + 1:] if ':' in time_string \
                            else 0)


# -----------------------------------------------------------------------------
# --------------------TODO: move to separate file------------------------------
# -----------------------------------------------------------------------------
def get_detailed_course_json(school, course, sem, student=None):
  json_data = get_basic_course_json(course, sem, ['prerequisites', 'exclusions', 'areas'])
  # json_data['textbook_info'] = course.get_all_textbook_info()
  json_data['eval_info'] = eval_add_unique_term_year_flag(course, course.get_eval_info())
  json_data['related_courses'] = course.get_related_course_info(sem, limit=5)
  json_data['reactions'] = course.get_reactions(student)
  json_data['textbooks'] = course.get_textbooks(sem)
  json_data['integrations'] = list(course.get_course_integrations())
  json_data['regexed_courses'] = get_regexed_courses(school, json_data)
  json_data['popularity_percent'] = get_popularity_percent_from_course(course, sem)
  return json_data

def get_classmates_in_course(request, school, sem_name, year, id):
  global SCHOOL
  SCHOOL = school.lower()
  sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
  json_data = {}
  try:
    course = Course.objects.get(school=school, id=id)
    student = None
    logged = request.user.is_authenticated()
    if logged and Student.objects.filter(user=request.user).exists():
      student = Student.objects.get(user=request.user)
    if student and student.user.is_authenticated() and student.social_courses:
      json_data = get_classmates_from_course_id(school, student, course.id,sem)

  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

def eval_add_unique_term_year_flag(course, evals):
  """
  Flag all eval instances s.t. there exists repeated term+year values.

  Return:
    List of modified evaluation dictionaries (added flag 'unique_term_year')
  """
  years = Evaluation.objects.filter(course=course).values('year').annotate(Count('id')).filter(id__count__gt=1).values_list('year')
  years = { e[0] for e in years }
  for eval in evals:
      eval['unique_term_year'] = not eval['year'] in years
  return evals

def get_popularity_percent_from_course(course, sem):
    added = PersonalTimetable.objects.filter(courses__in=[course], semester=sem).values('student').distinct().count()
    capacity = sum(Section.objects.filter(course=course, semester=sem).values_list('size', flat=True))
    try:
      return added / float(capacity)
    except ZeroDivisionError:
      return 0

def get_basic_course_json(course, sem, extra_model_fields=[]):
  basic_fields = ['code','name', 'id', 'description', 'department', 'num_credits', 'areas', 'campus']
  course_json = model_to_dict(course, basic_fields + extra_model_fields)
  course_json['evals'] = course.get_eval_info()
  course_json['integrations'] = list(course.get_course_integrations())
  course_json['sections'] = {}

  course_section_list = sorted(course.section_set.filter(semester=sem),
                              key=lambda section: section.section_type)

  for section_type, sections in itertools.groupby(course_section_list, lambda s: s.section_type):
    course_json['sections'][section_type] = {section.meeting_section: [merge_dicts(model_to_dict(co), model_to_dict(section)) \
                                                                        for co in section.offering_set.all()]\
                                              for section in sections}

  return course_json

def get_course(request, school, sem_name, year, id):
  global SCHOOL
  SCHOOL = school.lower()

  sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
  try:
    course = Course.objects.get(school=school, id=id)
    student = None
    logged = request.user.is_authenticated()
    if logged and Student.objects.filter(user=request.user).exists():
      student = Student.objects.get(user=request.user)
    json_data = get_detailed_course_json(school, course, sem, student)

  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

@csrf_exempt
def get_course_id(request, school, code):
  school = school.lower()
  try:
    course = Course.objects.filter(school=school, code__icontains=code)[0]
    json_data = {"id": course.id}
  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

def get_regexed_courses(school, json_data):
  regexed_courses = {}
  if school in school_to_course_regex:
    matched_courses = re.findall(school_to_course_regex[school], json_data['description'] + json_data['prerequisites'])
    for c in matched_courses:
      try:
        regexed_course = Course.objects.filter(school=school, code__icontains=c)[0]
        regexed_courses[c] = regexed_course.name
      except:
        pass
  return regexed_courses

### COURSE SEARCH ###

def get_course_matches(school, query, semester):
  if query == "":
    return Course.objects.filter(school=school)

  query_tokens = query.split()
  course_name_contains_query = reduce(
    operator.and_, map(course_name_contains_token, query_tokens))
  return Course.objects.filter(
    Q(school=school) &\
    course_name_contains_query &\
    Q(section__semester=semester)
  )

def course_name_contains_token(token):
  return (Q(code__icontains=token) | \
          Q(name__icontains=token.replace("&", "and")) | \
          Q(name__icontains=token.replace("and", "&")))

@csrf_exempt
@validate_subdomain
def course_search(request, school, sem_name, year, query):
  sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
  course_match_objs = get_course_matches(school, query, sem)
  course_match_objs = course_match_objs.distinct('code')[:4]
  save_analytics_course_search(query[:200], course_match_objs[:2], sem, school, get_student(request))
  course_matches = [get_basic_course_json(course, sem) for course in course_match_objs]
  json_data = {'results': course_matches}
  return HttpResponse(json.dumps(json_data), content_type="application/json")

# ADVANCED SEARCH
@csrf_exempt
@validate_subdomain
def advanced_course_search(request):
  school = request.subdomain
  params = json.loads(request.body)
  sem, _ = Semester.objects.get_or_create(**params['semester'])
  query = params['query']
  filters = params['filters']
  times = filters['times']

  # filtering first by user's search query
  course_match_objs = get_course_matches(school, query, sem)

  # filtering now by departments, areas, or levels if provided
  if filters['areas']:
    course_match_objs = course_match_objs.filter(areas__in=filters['areas'])
  if filters['departments']:
    course_match_objs = course_match_objs.filter(department__in=filters['departments'])
  if filters['levels']:
    course_match_objs = course_match_objs.filter(level__in=filters['levels'])
  if filters['times']:
    day_map = {"Monday": "M", "Tuesday": "T", "Wednesday": "W", "Thursday": "R", "Friday": "F"}
    course_match_objs = course_match_objs.filter(reduce(operator.or_,
      (Q(section__offering__time_start__gte="{0:0=2d}:00".format(min_max['min']),
        section__offering__time_end__lte="{0:0=2d}:00".format(min_max['max']),
        section__offering__day=day_map[min_max['day']],
        section__semester=sem,
        section__section_type="L", # we only want to show classes that have LECTURE sections within the given boundaries
        )
      for min_max in filters['times'])))

  valid_section_ids = Section.objects.filter(
    course__in=course_match_objs, semester=sem).values('course_id')
  course_match_objs = course_match_objs.filter(id__in=valid_section_ids).distinct('code')[:50] # limit to 50 search results
  save_analytics_course_search(query[:200], course_match_objs[:2], sem, school, get_student(request), advanced=True)
  student = None
  logged = request.user.is_authenticated()
  if logged and Student.objects.filter(user=request.user).exists():
      student = Student.objects.get(user=request.user)
  json_data = [get_detailed_course_json(request.subdomain, course, sem, student) for course in course_match_objs]

  return HttpResponse(json.dumps(json_data), content_type="application/json")

def jhu_timer(request):
  return render(request, "jhu_timer.html")

@validate_subdomain
def course_page(request, code):
  school = request.subdomain
  try:
    school_name = school_code_to_name[school]
    course_obj = Course.objects.filter(code__iexact=code)[0]
    # TODO: hard coding (section type, semester)
    course_dict = get_basic_course_json(course_obj, 
          Semester.objects.get_or_create(name='Fall', year=datetime.now().year)[0])
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
    return render_to_response("course_page.html",
      {'school': school,
       'school_name': school_name,
       'course': course_dict,
       'lectures': l if l else None,
       'tutorials': t if t else None,
       'practicals': p if p else None,
       'url': course_url,
       'evals': clean_evals,
       'avg': avg
       },
    context_instance=RequestContext(request))
  except Exception as e:
    return HttpResponse(str(e))

@validate_subdomain
def all_courses(request):
  school = request.subdomain
  school_name = school_code_to_name[school]
  try:
    course_map = collections.OrderedDict()
    departments = Course.objects.filter(school=school).order_by('department').values_list('department', flat=True).distinct()
    for department in departments:
      course_map[department] = Course.objects.filter(school=school, department=department).all()
    return render_to_response("all_courses.html",
      {'course_map': course_map,
       'school': school,
       'school_name': school_name
       },
    context_instance=RequestContext(request))
  except Exception as e:
    return HttpResponse(str(e))

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

@validate_subdomain
def school_info(request, school):
  school = request.subdomain
  last_updated = None
  if Updates.objects.filter(school=school, update_field="Course").exists():
    update_time_obj = Updates.objects.get(school=school, update_field="Course")\
                                    .last_updated.astimezone(timezone('US/Eastern'))
    last_updated = update_time_obj.strftime('%Y-%m-%d %H:%M') + " " + update_time_obj.tzname()
  json_data = {
    'areas': sorted(list(Course.objects.filter(school=school)\
                                      .exclude(areas__exact='')\
                                      .values_list('areas', flat=True)\
                                      .distinct())),
    'departments': sorted(list(Course.objects.filter(school=school)\
                                            .exclude(department__exact='')\
                                            .values_list('department', flat=True)\
                                            .distinct())),
    'levels': sorted(list(Course.objects.filter(school=school)\
                                        .exclude(level__exact='')\
                                        .values_list('level', flat=True)\
                                        .distinct())),
    'last_updated': last_updated
  }
  return HttpResponse(json.dumps(json_data), content_type="application/json")

@csrf_exempt
@validate_subdomain
def get_integration(request, integration_id, course_id):
  has_integration = False
  if CourseIntegration.objects.filter(course_id=course_id, integration_id = integration_id):
    has_integration = True
  return HttpResponse(json.dumps({'integration_enabled': has_integration}), content_type="application/json")

@csrf_exempt
@validate_subdomain
def delete_integration(request, integration_id, course_id):
  CourseIntegration.objects.filter(course_id=course_id, integration_id = integration_id).delete()
  return HttpResponse(json.dumps({'deleted': True}), content_type="application/json")

@csrf_exempt
@validate_subdomain
def add_integration(request, integration_id, course_id):
  desc = json.loads(request.body)['json']
  link, created = CourseIntegration.objects.update_or_create(course_id=course_id, integration_id = integration_id, json = desc)
  return HttpResponse(json.dumps({'created': created}), content_type="application/json")

from django.views.decorators.cache import never_cache
from django.template.loader import get_template
@never_cache
def sw_js(request, js):
    template = get_template('sw.js')
    html = template.render()
    return HttpResponse(html, content_type="application/x-javascript")

def manifest_json(request, js):
    template = get_template('manifest.json')
    html = template.render()
    return HttpResponse(html, content_type="application/json")

def profile(request):
  logged = request.user.is_authenticated()
  if logged and Student.objects.filter(user=request.user).exists():
    student = Student.objects.get(user=request.user)
    reactions = Reaction.objects.filter(student=student).values('title').annotate(count=Count('title'))
    # googpic = this.props.userInfo.img_url.replace('sz=50','sz=100') if this.props.userInfo.isLoggedIn else ''
    # propic = 'url(https://graph.facebook.com/' + JSON.parse(currentUser).fbook_uid + '/picture?type=normal)' if this.props.userInfo.FacebookSignedUp else 'url(' + googpic + ')'
    if student.user.social_auth.filter(provider='google-oauth2').exists():
      hasGoogle = True
    else:
      hasGoogle = False
    if student.user.social_auth.filter(provider='facebook').exists():
      social_user = student.user.social_auth.filter(provider='facebook').first()
      img_url = 'https://graph.facebook.com/' + student.fbook_uid + '/picture?width=700&height=700'
      hasFacebook = True
    else:
      social_user = student.user.social_auth.filter(provider='google-oauth2').first()
      img_url = student.img_url.replace('sz=50','sz=700')
      hasFacebook = False
    hasNotificationsEnabled = RegistrationToken.objects.filter(student=student).exists()
    context = {
      'name': student.user,
      'major': student.major,
      'class': student.class_year,
      'student': student,
      'total': 0,
      'img_url': img_url,
      'hasGoogle': hasGoogle,
      'hasFacebook': hasFacebook,
      'notifications': hasNotificationsEnabled
    }
    for r in reactions:
        context[r['title']] = r['count']
    for r in Reaction.REACTION_CHOICES:
        if r[0] not in context:
            context[r[0]] = 0
        context['total'] += context[r[0]]
    return render_to_response("profile.html", context, context_instance=RequestContext(request))
  else:
    return signup(request)

def get_current_semesters(school):
  """
  For a given school, get the possible semesters and the most recent year for each
  semester that has course data, and return a list of (semester name, year) pairs.
  """
  return school_to_semesters[school]

@csrf_exempt
def final_exam_scheduler(request):
  final_exam_schedule = jhu_final_exam_scheduler.make_schedule(json.loads(request.body))
  return HttpResponse(json.dumps(final_exam_schedule), content_type="application/json")

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
