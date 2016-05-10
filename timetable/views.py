import copy
import functools
import itertools
import json
import logging
import os
from collections import OrderedDict

from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.db.models import Q
from hashids import Hashids
from pytz import timezone

from analytics.views import *
from timetable.models import *
from timetable.school_mappers import school_to_models, school_to_granularity, VALID_SCHOOLS


MAX_RETURN = 60 # Max number of timetables we want to consider

SCHOOL = ""

# hashid = Hashids("***REMOVED***")
logger = logging.getLogger(__name__)

def redirect_to_home(request):
  return HttpResponseRedirect("/")

def mark_request(request, sid):
  create_session_for_request(request, sid)

def save_analytics_data(key, args):
  try:
    if key == "timetables":
      save_timetable_data(args['sid'], args['school'], args['courses'], args['count'])
  except:
    pass

def validate_subdomain(view_func):
  def wrapper(request, *args, **kwargs):
    if request.subdomain is None:
      return render(request, 'index.html')
    else:
      return view_func(request, *args, **kwargs)
  return wrapper
# ******************************************************************************
# ******************************** GENERATE TTs ********************************
# ******************************************************************************

@validate_subdomain
def view_timetable(request):
  return render(request, 'timetable.html')

@csrf_exempt
def get_timetables(request):
  """Generate best timetables given the user's selected courses"""
  global SCHOOL

  params = json.loads(request.body)
  sid = params['sid']
  mark_request(request, sid)

  SCHOOL = request.subdomain
  SchoolCourse, SchoolCourseOffering = school_to_models[SCHOOL]

  course_ids = params['courseSections'].keys()
  courses = [SchoolCourse.objects.get(id=cid) for cid in course_ids]
  locked_sections = params['courseSections']
  for updated_course in params.get('updated_courses', []): 
    cid = str(updated_course['course_id'])
    locked_sections[cid] = locked_sections.get(cid, {})
    if cid not in course_ids:
      courses.append(SchoolCourse.objects.get(id=int(cid)))

    for locked_section in filter(bool, updated_course['section_codes']):
      update_locked_sections(locked_sections, cid, 
                  locked_section, SchoolCourseOffering)

  # temp optional course implementation
  opt_course_ids = params['optionCourses'] if 'optionCourses' in params else []
  k = params['numOptionCourses'] if 'numOptionCourses' in params else 0
  optional_courses = [SchoolCourse.objects.get(id=cid) for cid in opt_course_ids]
  optional_course_subsets = itertools.combinations(optional_courses, k) or [[]]
  generator = TimetableGenerator(params['semester'], 
                  params['school'],
                  locked_sections,
                  params['preferences'])
  result = [timetable for opt_courses in optional_course_subsets \
      for timetable in generator.courses_to_timetables(courses + list(opt_courses))]
  save_analytics_data('timetables', {'sid': sid, 'school': SCHOOL, 
                  'courses': courses, 'count': len(result)})
  # updated roster object 
  response = {'timetables': result, 'new_c_to_s': locked_sections}
  return HttpResponse(json.dumps(response), content_type='application/json')

def get_section_type(cid, section_code, offering_table):
  """Query offering table to get section type of provided section."""
  co = offering_table.objects.filter(course=int(cid), 
                    meeting_section=section_code)[0]
  return co.section_type

def update_locked_sections(locked_sections, cid, locked_section, offering_table):
  """
  Take cid of new course, and locked section for that course
  and toggle its locked status (ie if was locked, unlock and vice versa.
  """
  section_type = get_section_type(cid, locked_section, offering_table)
  if locked_sections[cid].get(section_type, '') == locked_section: # already locked
    locked_sections[cid][section_type] = '' # unlock that section_type
  else: # add as locked section for that section_type
    locked_sections[cid][section_type] = locked_section

class TimetableGenerator:
  def __init__(self, semester, school, locked_sections, preferences):
    self.school = school
    self.slots_per_hour = 60 / school_to_granularity[school]
    self.course_model = school_to_models[school][0]
    self.offering_model = school_to_models[school][1]
    self.semester = semester
    self.no_classes_before = 0 if not preferences['no_classes_before'] else self.slots_per_hour * 2 - 1
    self.no_classes_after = self.slots_per_hour * 14 if not preferences['no_classes_after'] else self.slots_per_hour * 10 + 1
    self.long_weekend = preferences['long_weekend']
    self.least_days = preferences.get('least_days', False)
    self.break_times = preferences.get('break_times', False)
    self.break_lengths = preferences.get('break_lengths', [])
    self.spread = not preferences['grouped']
    self.sort_by_spread = preferences['do_ranking']
    self.with_conflicts = preferences['try_with_conflicts']
    self.locked_sections = locked_sections

  def courses_to_timetables(self, courses):
    print courses
    timetables = self.get_best_timetables(courses)
    result = [self.convert_tt_to_dict(tt) for tt in timetables]
    return result

  def convert_tt_to_dict(self, timetable):
    tt_obj = {}
    grouped = itertools.groupby(timetable, self.get_course_dict)
    tt_obj['courses'] = list(itertools.starmap(self.get_course_obj, grouped))
    return tt_obj

  def get_course_dict(self, section):
    model = self.course_model.objects.get(id=section[0])
    return model_to_dict(model, fields=['code', 'name', 'id'])

  def get_course_obj(self, course_dict, sections):
    sections = list(sections)
    slot_objects = [create_offering_object(co) for _, _, course_offerings in sections
                           for co in course_offerings]
    course_dict['enrolled_sections'] = [section_code for _, section_code, _ in sections]
    try:
      section = course_dict['enrolled_sections'][0]
      if (self.school == "uoft"):
        sections = filter(lambda x: x[0] == "L", course_dict['enrolled_sections'])
        if len(sections) != 0:
          section = sections[0]

      c = self.course_model.objects.get(id=course_dict['id'])
      co = self.offering_model.objects.filter(meeting_section=section, course=c)[0]
      course_dict['textbooks'] = co.get_textbooks()
      course_dict['evaluations'] = co.get_evaluations()
    except:
      import traceback
      traceback.print_exc()
    course_dict['slots'] = slot_objects
    return course_dict

  def get_best_timetables(self, courses):
    with_preferences = self.get_timetables_with_all_preferences(courses)
    return with_preferences if with_preferences[0] != () \
                else self.get_timetables_with_some_preferences(courses)

  def get_timetables_with_all_preferences(self, courses):
    preference_timetable = [p for p in self.construct_preference_tt() if p]
    valid_timetables = []

    for pref_combination in itertools.product(*preference_timetable):
      possible_offerings = self.courses_to_offerings(courses, pref_combination)
      new_timetables = self.create_timetable_from_offerings(possible_offerings)
      if new_timetables: 
        valid_timetables += new_timetables
      if len(valid_timetables) >= MAX_RETURN:
        break

    if not valid_timetables: valid_timetables = [()]
    return rank_by_spread(valid_timetables) if self.sort_by_spread else valid_timetables

  def get_timetables_with_some_preferences(self, courses):
    """
    Generate timetables from all offerings (no pre-filtering of course offerings), 
    and return timetables ranked by # of preferences satisfied.
    """
    all_offerings = self.courses_to_offerings(courses)
    timetables = self.create_timetable_from_offerings(all_offerings)
    s = sorted(timetables, key=functools.partial(get_rank_score, metric=get_preference_score))
    return s

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
      day_to_usage = {'M': [[] for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
              'T': [[] for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
              'W': [[] for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
              'R': [[] for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
              'F': [[] for i in range(14 * 60 / school_to_granularity[SCHOOL])]}
      no_conflicts = True
      for i in xrange(len(sections)): # add an offering for the next section
        j = (p/num_permutations_remaining[i]) % num_offerings[i]
        day_to_usage, conflict, new_meeting = add_meeting_and_check_conflict(day_to_usage, sections[i][j])
        if conflict and not self.with_conflicts: # there's a conflict and we don't want to consider it
          no_conflicts = False
          break
        current_tt.append(new_meeting)
      if no_conflicts and len(current_tt) != 0:
        yield tuple(current_tt)

  def courses_to_offerings(self, courses, plist=[]):
    """
    Takes a list of courses as input, and returns a list r such as:
    > [
      [[2, u'L5101', [[<CourseOffering> []], [<CourseOffering> []]]],
      [[2, u'P5101', [[<CourseOffering> []], [<CourseOffering> []]]],
      [[2, u'T0101', [[<CourseOffering> []]]], [2, u'T0201', [[<CourseOffering> []]]]],
      [[37, u'L1001', [[<CourseOffering> []], [<CourseOffering> []]]], [37, u'L2001', [[<CourseOffering> []]]]],
      etc...
      ]
    where r is a list of lists representing the meeting sections across all courses.
    Each list contains the course id, meeting section, and pairs where the first 
    elements are courseoffering objects and the second elements are lists used to keep 
    track of conflict information for that specific courseoffering.
    """
    sections = []
    for c in courses:
      offerings = self.offering_model.objects.filter(~Q(time_start__iexact='TBA'), \
                          (Q(semester=self.semester) | Q(semester='Y')), \
                          course=c)
      section_to_offerings = get_section_to_offering_map(offerings)
      section_type_to_sections = get_section_type_to_sections_map(section_to_offerings, \
                                    plist, \
                                    c.id)
      for section_type in section_type_to_sections:
        # if there are any locked sections for given type, course
        if str(c.id) in self.locked_sections and self.locked_sections[str(c.id)].get(section_type, False):
          locked_section = self.locked_sections[str(c.id)][section_type]
          pinned = [c.id, locked_section, section_to_offerings[locked_section]]
          sections.append([pinned])
        else:
          sections.append(section_type_to_sections[section_type])
    # sections.sort(key = lambda l: len(l), reverse=False)
    return sections

  def construct_preference_tt(self):
    """
    Constructs a preference "timetable" based on the input preferences.
    Assumes that the inputs are always defined. A preference "timetable"
    is a list of lists consisting of predicates. Each sublist represents 
    a specific preference which is satisfied if any one of the predicates in 
    the sublist returns false. For example, in the following "tt":
    [
      [lambda co: co.time_start > 3 or co.time_end < 21], 
      [lambda co: co.day == 'M', lambda co: co.day == 'F']
    ]
    The first sublist represents the preference of starting and ending between
    10am and 6pm, and the second represents the preference of having a long 
    weekend (i.e. either no classes monday or no classes friday). 
    The reason this is similar to a timetable is because the set of all preferences are satisfied 
    if there is some combination of preferences (one from each sublist) that
    returns is False.
    """
    tt = []
    # early/late class preference
    if (self.no_classes_before > 0 or self.no_classes_after < 14 * 60/school_to_granularity[self.school]):
      tt.append([lambda co: not (get_time_index_from_string(co[0].time_start) > self.no_classes_before \
                and get_time_index_from_string(co[0].time_end) < self.no_classes_after)])

    # long weekend preference 
    if self.least_days:
      tt.append([(lambda co: co[0].day == 'T'), \
            (lambda co: co[0].day == 'W'), \
            (lambda co: co[0].day == 'R'), \
            (lambda co: co[0].day == 'M'), \
            (lambda co: co[0].day == 'F')])
    
    elif self.long_weekend:
      tt.append([(lambda co: co[0].day == 'M'), \
            (lambda co: co[0].day == 'F')])

    # break time preference
    if self.break_times:
      break_periods = [self.break_times[i:i+self.break_length] for i in range(len(self.break_times) - self.break_length + 1)]
      break_possibilities = [(lambda co: not (get_time_index_from_string(co[0].time_start) > periods[-1] \
                        and get_time_index_from_string(co[0].time_end) < periods[0])) \
                  for periods in break_periods]
      tt.append(break_possibilities)

    return tt

def rank_by_spread(timetables):
  return sorted(timetables, 
        key=functools.partial(get_rank_score, metric=get_spread_score), 
        reverse=SPREAD)

def get_rank_score(timetable, metric):
  """Get score for a timetable. The higher the score, the more grouped it is."""
  day_to_usage = {'M': [False for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
          'T': [False for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
          'W': [False for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
          'R': [False for i in range(14 * 60 / school_to_granularity[SCHOOL])], 
          'F': [False for i in range(14 * 60 / school_to_granularity[SCHOOL])]}
  conflict_cost = 0
  for meeting in timetable:
    for co, conflict in meeting[2]:
      for index in find_slots_to_fill(co.time_start, co.time_end):
        if day_to_usage[co.day][index] == True:
          conflict_cost += 500
        else:
          day_to_usage[co.day][index] = True
  return metric(day_to_usage) + conflict_cost

def get_spread_score(day_to_usage):
  """Get score which is higher the more spread out the timetable is."""
  return sum([calculate_spread_by_day(day_to_usage[day]) for day in day_to_usage.keys()])

def calculate_spread_by_day(day_bitarray):
  """Calculate the score for a bit array representing a day's schedule."""
  day_string = ''.join(map(lambda s: 'T' if s else ' ', day_bitarray)).strip()
  break_lengths = day_string.split('T')
  return sum(map(lambda s: len(s)**2, break_lengths)) if len(break_lengths) > 2 \
                            else 0

def get_preference_score(day_to_usage):
  """Calculate cost for long weekend, early/late class, and break preferences."""
  day_cost = get_day_cost(day_to_usage)
  time_cost = 0
  for day in day_to_usage.keys():
    time_cost += get_time_cost(day_to_usage[day])
  break_cost = get_break_cost(day_to_usage)
  return sum([day_cost, time_cost, break_cost])

def get_day_cost(day_to_usage):
  """Cost of having/not having a long weekend, based on user's preferences."""
  if not LONG_WEEKEND and not LEAST_DAYS:
    return 0
  elif LONG_WEEKEND:
    return day_use(day_to_usage, 'M', 'F')
  else:
    return day_use(day_to_usage, 'M' ,'T', 'W', 'R', 'F')

def get_time_cost(day_bitarray):
  """Cost of having early/late classes, based on the user's preferences."""
  return sum([1 for slot in (day_bitarray[:NO_CLASSES_BEFORE] +
                 day_bitarray[NO_CLASSES_AFTER:]) 
          if slot])

def get_break_cost(day_to_usage):
  return 0

def day_use(day_to_usage, *days):
  return sum([1 for day in days if any(day_to_usage[day])])

def create_offering_object(co_pair):
  """Return CourseOffering object augmented with its conflict information."""
  co, conflict_info = co_pair
  slot_obj = model_to_dict(co)
  slot_obj['depth_level'] = conflict_info[0]
  slot_obj['num_conflicts'] = conflict_info[1]
  slot_obj['shift_index'] = conflict_info[2]
  return slot_obj

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
  course_id, section_code, course_offerings = copy.deepcopy(new_meeting)
  exists_conflict = False
  for i in range(len(course_offerings)): # use index to avoid referencing copies
    offering = course_offerings[i][0]
    day = offering.day
    offering_conflict = False
    for slot in find_slots_to_fill(offering.time_start, offering.time_end):
      if day_to_usage[day][slot]:
        exists_conflict = True
        offering_conflict = True
      day_to_usage[day][slot].append(course_offerings[i])
  return (day_to_usage, exists_conflict, (course_id, section_code, course_offerings))

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

def get_hour(str_time):
  si = str_time.index(':') if ':' in str_time else len(str_time)
  return int(str_time[:si])

def get_section_type_to_sections_map(section_to_offerings, plist, cid):
  """Return map: section_type -> [cid, section, [offerings]] """
  section_type_to_sections = {offerings[0][0].section_type: [] for section, offerings in section_to_offerings.iteritems()}
  i = 0
  for section, offerings in section_to_offerings.iteritems():
    if not violates_any_preferences(offerings, plist):
      # section_type for all offerings for a given section should be the same,
      # so we just take the first one
      section_type = offerings[0][0].section_type
      section_type_to_sections[section_type].append([cid, \
                            section, \
                            section_to_offerings[section]])
    i += 1
  return section_type_to_sections

def violates_any_preferences(offerings, plist):
  return any([check_co_against_preferences(plist, co) for co in offerings])

def get_section_to_offering_map(offerings):
  """ Return map: section_code -> [offerings] """
  section_to_offerings = OrderedDict()
  for offering in offerings:
    section_code = offering.meeting_section
    if section_code in section_to_offerings:
      section_to_offerings[section_code].append([offering, [0, 1, 0]])
    else: # new section
      section_to_offerings[section_code] = [[offering, [0, 1, 0]]]
  return section_to_offerings

def check_co_against_preferences(preference_list, co):
  """
  Take a list of preferences - each preference is a function which takes a courseoffering and
  returns True if the courseoffering goes against the preference and False otherwise, and a courseoffering,
  and returns True if any of the preferences are violated and False otherwise.
  """
  return any(map(lambda f: f(co), preference_list))

def get_time_index_from_string(s):
  """Find the time index based on course offering string (e.g. 8:30 -> 2)"""
  return get_time_index(*get_hours_minutes(s))

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

@csrf_exempt
def get_courses(request, school, sem):
  school = school.lower()
  sem = sem.upper()
  if (school not in school_to_models) or (sem not in ["F", "S"]):
    json_data = []
  else:
    module_dir = os.path.dirname(__file__)  # get current directory
    file_path = os.path.join(module_dir, 
      "courses_json/" + school + "-" + sem + ".json")
    data = open(file_path).read()
    json_data = json.loads(data)
    try:
      update_obj = Updates.objects.get(school=school,update_field="Course").last_updated.astimezone(timezone('US/Eastern'))
      last_updated = update_obj.strftime('%Y-%m-%d %H:%M') + " " + update_obj.tzname()
    except:
      last_updated = None
      
  return HttpResponse(json.dumps({
              'last_updated': last_updated, 
              'courses':json_data}), 
      content_type="application/json")

def get_course(request, school, sem, id):
  global SCHOOL
  SCHOOL = school.lower()
  try:
    C, Co = school_to_models[school]
    course = C.objects.get(id=id)
    json_data = my_model_to_dict(course, Co, sem)
    json_data['textbook_info'] = course.get_all_textbook_info()
    json_data['eval_info'] = course.get_eval_info()
    json_data['related_courses'] = course.get_related_course_info()

  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

@csrf_exempt
def get_course_id(request, school, sem, code):
  school = school.lower()
  try:
    models = school_to_models[school]
    C, Co = models[0], models[1]
    course = C.objects.filter(Q(code__icontains=code))[0]
    json_data = {"id": course.id}
  except:
    import traceback
    traceback.print_exc()
    json_data = {}

  return HttpResponse(json.dumps(json_data), content_type="application/json")

def convert_courses_to_json(courses, sem, limit=50):
  cs = []
  result_count = 0    # limiting the number of results one search query can provide to 50
  for course in courses:
    if result_count == limit: break
    if has_offering(course, sem):
      cs.append(course)
      result_count += 1
  return [get_course_serializable(course, sem) for course in cs]

def get_course_serializable(course, sem):
  d = model_to_dict(course)
  d['sections'] = get_meeting_sections(course, sem)
  return d

def get_meeting_sections(course, semester):
  SchoolCourse, SchoolCourseOffering = school_to_models[SCHOOL]   
  offering_objs = SchoolCourseOffering.objects.filter((Q(semester=semester) | Q(semester='Y')), 
                          course=course)          
  sections = []
  for o in offering_objs:
    if o.meeting_section not in sections:
      sections.append(o.meeting_section)
  sections.sort()
  return sections

def get_meeting_sections_objects(course, semester):
  SchoolCourse, SchoolCourseOffering = school_to_models[SCHOOL]   
  offering_objs = SchoolCourseOffering.objects.filter((Q(semester=semester) | Q(semester='Y')), course=course)          
  sections = []
  for o in offering_objs:
    if o.meeting_section not in sections:
      sections.append(model_to_dict(o))
  sections.sort()
  return sections

def has_offering(course, sem):
  SchoolCourse, SchoolCourseOffering = school_to_models[SCHOOL]   
  try:
    res = SchoolCourseOffering.objects.filter(~Q(time_start__iexact='TBA'), 
                      (Q(semester=sem) | Q(semester='Y')),
                      course_id=course.id)
    for offering in res:
      day = offering.day
      if day == 'S' or day == 'U':
        return False
    return True if len(res) > 0 else False
  except:
    return False


### COURSE SEARCH ###
# def my_model_to_dict(course, SchoolCourseOffering, sem):
#   fields=['code','name', 'id', 'description']
#   d = model_to_dict(course, fields)
#   d['slots'] = {}
#   res = SchoolCourseOffering.objects.filter(~Q(time_start__iexact='TBA'),
#                       (Q(semester=sem) | Q(semester='Y')),
#                       course_id=course.id)
#   section_list = res.values_list('meeting_section').distinct()
#   for section, in section_list:
#     d['slots'][section] = [model_to_dict(offering) for offering in res.filter(meeting_section=section)]
#   return d

## Organizing result sections by section type ###
def my_model_to_dict(course, SchoolCourseOffering, sem):
  fields=['code','name', 'id', 'description']
  d = model_to_dict(course, fields)
  d['sections'] = {}

  res = SchoolCourseOffering.objects.filter(~Q(time_start__iexact='TBA'),
                      (Q(semester=sem) | Q(semester='Y')),
                      course_id=course.id)
  section_list = res.values_list('meeting_section')
  section_type_list = res.values_list('section_type').distinct()
  for section_type, in section_type_list:
    d['sections'][section_type] = {}
  for co in res:
    section_code = co.meeting_section
    if section_code not in d['sections'][co.section_type]:
      d['sections'][co.section_type][section_code] = []
    d['sections'][co.section_type][section_code].append(model_to_dict(co))
  return d

@csrf_exempt
def course_search(request, school, sem, query):
  if school not in VALID_SCHOOLS:
    raise Http404

  SchoolCourse, SchoolCourseOffering = school_to_models[school]

  course_match_objs = SchoolCourse.objects.filter((Q(code__icontains=query) | Q(description__icontains=query) | Q(name__icontains=query)))

  # We want to filter based on whether the course has an offering in this semester or not.
  # This part needs to be executed case-by-case because of Django's ORM.
  # Notice that each call to filter uses the appropriate "courseoffering" 
  # class name in the filter.
  if school == "uoft":
    course_match_objs = course_match_objs.filter(
      (Q(courseoffering__semester__icontains=sem) | Q(courseoffering__semester__icontains='Y')))
  elif school == "jhu":
    course_match_objs = course_match_objs.filter( 
      (Q(hopkinscourseoffering__semester__icontains=sem) | Q(hopkinscourseoffering__semester__icontains='Y')))
  elif school == "umd":
    course_match_objs = course_match_objs.filter( 
      (Q(umdcourseoffering__semester__icontains=sem) | Q(umdcourseoffering__semester__icontains='Y')))
  else:
    raise Http404

  course_match_objs = course_match_objs.distinct('code')[:4]

  course_matches = [my_model_to_dict(course, SchoolCourseOffering, sem) for course in course_match_objs]
  json_data = {'results': course_matches}
  return HttpResponse(json.dumps(json_data), content_type="application/json")

def jhu_timer(request):
  return render(request, "jhu_timer.html")
