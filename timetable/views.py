import copy
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
from django.db.models import Q
from hashids import Hashids
from pytz import timezone

from analytics.models import *
from analytics.views import *
from timetable.models import *
from timetable.school_mappers import school_to_granularity, VALID_SCHOOLS
from timetable.utils import *
from timetable.scoring import *
from student.models import Student
from student.views import get_student, get_user_dict, convert_tt_to_dict

MAX_RETURN = 60 # Max number of timetables we want to consider

SCHOOL = ""

# hashid = Hashids("***REMOVED***")
logger = logging.getLogger(__name__)

def redirect_to_home(request):
  return HttpResponseRedirect("/")

# ******************************************************************************
# ******************************** GENERATE TTs ********************************
# ******************************************************************************

@validate_subdomain
def view_timetable(request, code=None, sem=None, shared_timetable=None):
  school = request.subdomain
  student = get_student(request)
  course_json = None

  if not sem: # not loading a share course link
    sem = 'F'
  if code: # user is loading a share course link, since code was included
    sem = sem.upper()
    code = code.upper()
    try:
      course = Course.objects.get(school=school, code=code)
      course_json = get_detailed_course_json(course, sem, student)
    except:
      raise Http404

  return render_to_response("timetable.html", {
    'school': school,
    'student': json.dumps(get_user_dict(school, student, sem)),
    'course': json.dumps(course_json),
    'semester': sem,
    'shared_timetable': json.dumps(shared_timetable),
  },
  context_instance=RequestContext(request))

@validate_subdomain
def share_timetable(request, ref):
  try:
    shared_timetable = convert_tt_to_dict(SharedTimetable.objects.get(school=request.subdomain, id=ref),
                                          include_last_updated=False)
    semester = shared_timetable['semester']
    return view_timetable(request, sem=semester, shared_timetable=shared_timetable)
  except Exception as e:
    raise Http404

@csrf_exempt
@validate_subdomain
def create_share_link(request):
  school = request.subdomain
  params = json.loads(request.body)
  courses = params['timetable']['courses']
  has_conflict = params['timetable']['has_conflict']
  semester = params['semester']
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
      shared_timetable.sections.add(course_obj.section_set.get(meeting_section=section, semester__in=[semester, "Y"]))
  shared_timetable.save()

  response = {'link': shared_timetable.id}
  return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
def get_timetables(request):
  """Generate best timetables given the user's selected courses"""
  global SCHOOL

  params = json.loads(request.body)
  sid = params['sid']

  SCHOOL = request.subdomain

  course_ids = params['courseSections'].keys()
  courses = [Course.objects.get(id=cid) for cid in course_ids]
  save_analytics_timetable(courses, params['semester'], SCHOOL, get_student(request))
  locked_sections = params['courseSections']
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
                  params['preferences'])
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
  def __init__(self, semester, school, locked_sections, custom_events, preferences):
    self.school = school
    self.slots_per_hour = 60 / school_to_granularity[school]
    self.semester = semester
    self.with_conflicts = preferences.get('try_with_conflicts', False)
    self.sort_metrics = [(m['metric'], m['order']) \
                            for m in preferences.get('sort_metrics', []) \
                              if m['selected']]
    self.locked_sections = locked_sections
    self.custom_events = custom_events

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
    return model_to_dict(model, fields=['code', 'name', 'id', 'num_credits', 'department'])

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
        day_to_usage[event['day']][slot].append('custom_slot')

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
      sections = sorted(c.section_set.filter(Q(semester__in=[self.semester, 'Y'])), 
                        key=lambda s: s.section_type)
      grouped = itertools.groupby(sections, lambda s: s.section_type)
      for section_type, sections in grouped:
        if str(c.id) in self.locked_sections and self.locked_sections[str(c.id)].get(section_type, False):
          locked_section_code = self.locked_sections[str(c.id)][section_type]
          locked_section = next(s for s in sections if s.meeting_section == locked_section_code)
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
def get_detailed_course_json(course, sem, student=None):
  json_data = get_basic_course_json(course, sem, ['prerequisites', 'exclusions', 'areas'])
  # json_data['textbook_info'] = course.get_all_textbook_info()
  json_data['eval_info'] = course.get_eval_info()
  json_data['related_courses'] = course.get_related_course_info(sem, limit=5)
  json_data['reactions'] = course.get_reactions(student)
  json_data['textbooks'] = course.get_textbooks(sem)

  return json_data

def get_basic_course_json(course, sem, extra_model_fields=[]):
  basic_fields = ['code','name', 'id', 'description', 'department', 'num_credits', 'areas']
  course_json = model_to_dict(course, basic_fields + extra_model_fields)
  course_json['evals'] = course.get_eval_info()
  course_json['sections'] = {}

  course_section_list = sorted(course.section_set.filter(semester__in=[sem, "Y"]),
                              key=lambda section: section.section_type)

  for section_type, sections in itertools.groupby(course_section_list, lambda s: s.section_type):
    course_json['sections'][section_type] = {section.meeting_section: [merge_dicts(model_to_dict(co), model_to_dict(section)) \
                                                                        for co in section.offering_set.all()]\
                                              for section in sections}

  return course_json

def get_course(request, school, sem, id):
  global SCHOOL
  SCHOOL = school.lower()

  try:
    course = Course.objects.get(school=school, id=id)
    student = None
    logged = request.user.is_authenticated()
    if logged and Student.objects.filter(user=request.user).exists():
      student = Student.objects.get(user=request.user)
    json_data = get_detailed_course_json(course, sem, student)

  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

@csrf_exempt
def get_course_id(request, school, sem, code):
  school = school.lower()
  try:
    course = Course.objects.filter(school=school, code__icontains=code)[0]
    json_data = {"id": course.id}
  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

### COURSE SEARCH ###

def get_course_matches(school, query, semester):
  param_values = query.split()

  if query == "":
    return Course.objects.filter(school=school)

  return Course.objects.filter(school=school).filter(reduce(operator.and_, (Q(code__icontains=param) | Q(name__icontains=param.replace("&", "and")) | Q(name__icontains=param.replace("and", "&")) for param in param_values))).filter((Q(section__semester__in=[semester, 'Y'])))

@csrf_exempt
@validate_subdomain
def course_search(request, school, sem, query):
  course_match_objs = get_course_matches(school, query, sem)
  course_match_objs = course_match_objs.distinct('code')[:4]
  course_matches = [get_basic_course_json(course, sem) for course in course_match_objs]
  json_data = {'results': course_matches}
  return HttpResponse(json.dumps(json_data), content_type="application/json")

# ADVANCED SEARCH
@csrf_exempt
@validate_subdomain
def advanced_course_search(request):
  school = request.subdomain
  params = json.loads(request.body)
  sem = params['semester']
  query = params['query']
  filters = params['filters']
  times = filters['times']

  # filtering first by user's search query
  course_match_objs = get_course_matches(school, query, sem)

  # filtering now by departments, areas, or levels if provided
  if filters['areas']:
    course_match_objs = course_match_objs.filter(areas__in=filters['areas'])
    '''
      TODO(rohan)

      Use:
      course_match_objs.objects.filter(reduce(operator.or_, (Q(areas__contains=x) for x in filters['areas'])))
    '''
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
      for day_index, min_max in enumerate(filters['times']))))

  course_match_objs = course_match_objs.distinct('code')[:50] # limit to 50 search results
  student = None
  logged = request.user.is_authenticated()
  if logged and Student.objects.filter(user=request.user).exists():
      student = Student.objects.get(user=request.user)
  json_data = [get_detailed_course_json(course, sem, student) for course in course_match_objs]

  return HttpResponse(json.dumps(json_data), content_type="application/json")


def jhu_timer(request):
  return render(request, "jhu_timer.html")

@validate_subdomain
def course_page(request, code):
  school = request.subdomain
  try:
    course_obj = Course.objects.filter(code__iexact=code)[0]
    course_dict = get_basic_course_json(course_obj, "F")
    # TODO: section types should never be hardcoded
    l = course_dict['sections'].get('L', {}).values()
    t = course_dict['sections'].get('T', {}).values()
    p = course_dict['sections'].get('P', {}).values()
    return render_to_response("course_page.html",
      {'school': school,
       'course': course_dict,
       'lectures': l if l else None,
       'tutorials': t if t else None,
       'practicals': p if p else None,
       },
    context_instance=RequestContext(request))
  except Exception as e:
    return HttpResponse(str(e))

@validate_subdomain
def school_info(request, school):
  logger.error('test')
  school = request.subdomain
  last_updated = None
  if Updates.objects.filter(school=school, update_field="Course").exists():
    update_time_obj = Updates.objects.get(school=school, update_field="Course").last_updated.astimezone(timezone('US/Eastern'))
    last_updated = update_time_obj.strftime('%Y-%m-%d %H:%M') + " " + update_time_obj.tzname()
  json_data = { # TODO(rohan): Get all relevant fields (areas, departments, levels) properly
    'areas': sorted(list(Course.objects.filter(school=school).exclude(areas__exact='').values_list('areas', flat=True).distinct())),
    'departments': sorted(list(Course.objects.filter(school=school).exclude(department__exact='').values_list('department', flat=True).distinct())),
    'levels': sorted(list(Course.objects.filter(school=school).exclude(level__exact='').values_list('level', flat=True).distinct())),
    'last_updated': last_updated
  }
  return HttpResponse(json.dumps(json_data), content_type="application/json")