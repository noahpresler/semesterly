import itertools
import logging

from django.db.models import Count
from hashids import Hashids

from analytics.views import *
from courses.views import get_detailed_course_json
from student.models import Student
from student.views import get_student, get_user_dict, convert_tt_to_dict
from timetable.jhu_final_exam_test import *
from timetable.school_mappers import school_to_granularity, AM_PM_SCHOOLS, school_to_semesters, \
  final_exams_available
from timetable.scoring import *
from timetable.utils import *

MAX_RETURN = 60 # Max number of timetables we want to consider

SCHOOL = ""

hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")
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
    'final_exams_supported_semesters': map(lambda s: sem_dicts.index(s) ,final_exams_available.get(school, [])),
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
  student = get_student(request)
  try:
    timetable_id = hashids.decrypt(ref)[0]
    shared_timetable_obj = SharedTimetable.objects.get(school=request.subdomain, id=timetable_id)
    shared_timetable = convert_tt_to_dict(shared_timetable_obj, include_last_updated=False)
     # get default semester info
    return view_timetable(request, year=shared_timetable_obj.semester.year, sem_name=shared_timetable_obj.semester.name, shared_timetable=shared_timetable)
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
  semesters = school_to_semesters[school]
  # Ensure DB has all semesters.
  for semester in semesters:
    Semester.objects.update_or_create(**semester)
  return semesters


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
  