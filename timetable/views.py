from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.context_processors import csrf
from django.utils import timezone
from django.conf import settings
from django.template import RequestContext
from django.contrib import messages
import datetime, math

from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from timetable.models import Course, CourseOffering, HopkinsCourse, HopkinsCourseOffering
from analytics.models import *

from django.forms.models import model_to_dict

from django.db.models import Q
from hashids import Hashids

from collections import OrderedDict, defaultdict
import json, copy, re, operator, itertools, functools
import os

MAX_RETURN = 60 # Max number of timetables we want to consider

# TODO: pass preferences in from frontend
NO_CLASSES_BEFORE = 4 # No classes before 10
NO_CLASSES_AFTER = 20 # No classes after 6
LONG_WEEKEND = False
LEAST_DAYS = False
BREAK_DAYS = ['M', 'T', 'W', 'R', 'F']
BREAK_TIMES = [] # [8, 9, 2]
BREAK_LENGTH = 2
SORT_BY_SPREAD = False
SPREAD = False
WITH_CONFLICTS = False
SCHOOL = ""
LOCKED_SECTIONS = []

hashid = Hashids("***REMOVED***")



def redirect_to_home(request):
    return HttpResponseRedirect("/")


# ******************************************************************************
# ******************************** GENERATE TTs ********************************
# ******************************************************************************

@csrf_exempt
def view_timetable(request):
    global SCHOOL, LOCKED_SECTIONS
    """Generate best timetables given the user's selected courses"""
    if not request.POST:
        return render_to_response('timetable.html', {}, 
                                    context_instance=RequestContext(request))
    params = json.loads(request.body)
    SCHOOL = params['school']   
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)

    course_ids = params['courses_to_sections'].keys()
    try:
        courses = [SchoolCourse.objects.get(id=cid) for cid in course_ids]
        LOCKED_SECTIONS = params['courses_to_sections']
        set_tt_preferences(params['preferences'])
        result = courses_to_timetables(courses, params['semester'])
    except:
        result = {'error': True}
    return HttpResponse(json.dumps(result), content_type='application/json')

def set_tt_preferences(preferences):
    global NO_CLASSES_BEFORE, NO_CLASSES_AFTER, SORT_BY_SPREAD, LONG_WEEKEND
    global SPREAD, WITH_CONFLICTS
    slots_per_hour = 60 / get_granularity(SCHOOL)
    NO_CLASSES_BEFORE = 0 if not preferences['no_classes_before'] else slots_per_hour * 2 - 1
    NO_CLASSES_AFTER = slots_per_hour * 14 if not preferences['no_classes_after'] else slots_per_hour * 10 + 1
    LONG_WEEKEND = preferences['long_weekend']
    SPREAD = not preferences['grouped']
    SORT_BY_SPREAD = preferences['do_ranking']
    WITH_CONFLICTS = preferences['try_with_conflicts']

def save_tt_analytics(request, course_list, result):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   
    try:
        analytics_tt = SchoolTimetable(session=Session.objects.get(session_id=request.POST['u_sid']))
        analytics_tt.save()
        for c in course_list: 
            analytics_tt.courses.add(c)
        analytics_tt.is_conflict = True if not result else False
        analytics_tt.save()
    except:
        pass

def get_correct_models(school):
    if school == 'jhu':
        return (HopkinsCourse, HopkinsCourseOffering, HopkinsSearchQuery, HopkinsTimetable)
    else:
        return (Course, CourseOffering, SearchQuery, Timetable)

def get_granularity(school):
    if school == 'uoft':
        return 30
    elif school == 'jhu':
        return 5
# ******************************************************************************
# ************************** COURSES -> TTs ************************************
# ******************************************************************************

def courses_to_timetables(courses, semester):
    timetables = get_best_timetables(courses, semester)
    reset_preferences()
    result = [convert_tt_to_dict(tt) for tt in timetables]
    return result

def reset_preferences():
    global WITH_CONFLICTS, LOCKED_SECTIONS
    WITH_CONFLICTS = False
    LOCKED_SECTIONS = []

def convert_tt_to_dict(timetable):
    tt_obj = {}
    grouped = itertools.groupby(timetable, get_course_dict)
    tt_obj['courses'] = list(itertools.starmap(get_course_obj, grouped))
    return tt_obj

def get_course_dict(section):
    SchoolCourse = get_correct_models(SCHOOL)[0] # model containing courses
    model = SchoolCourse.objects.get(id=section[0])
    return model_to_dict(model, fields=['code', 'name', 'id'])

def get_course_obj(course_dict, sections):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)  
    sections = list(sections)
    slot_objects = [create_offering_object(co) for _, _, course_offerings in sections
                                               for co in course_offerings]
    course_dict['enrolled_sections'] = [section_code for _, section_code, _ in sections]
    try:
        c = SchoolCourse.objects.get(id=course_dict['id'])
        co = SchoolCourseOffering.objects.filter(meeting_section=course_dict['enrolled_sections'][0], course=c)[0]
        course_dict['textbooks'] = co.get_textbooks()
    except:
        import traceback
        traceback.print_exc()
    course_dict['slots'] = slot_objects
    return course_dict

def get_best_timetables(courses, semester):
    with_preferences = get_timetables_with_all_preferences(courses, semester)
    return with_preferences if with_preferences[0] != () \
                            else get_timetables_with_some_preferences(courses, semester)

def get_timetables_with_all_preferences(courses, semester):
    preference_timetable = [p for p in construct_preference_tt() if p]
    valid_timetables = []

    for pref_combination in itertools.product(*preference_timetable):
        possible_offerings = courses_to_offerings(courses, semester, pref_combination)
        with_conflicts = False # When trying to apply all preference, try first with NO conflicts
        new_timetables = create_timetable_from_offerings(possible_offerings, with_conflicts)
        if new_timetables: valid_timetables += new_timetables
        if len(valid_timetables) > MAX_RETURN:
            break

    if not valid_timetables: valid_timetables = [()]
    return rank_by_spread(valid_timetables) if SORT_BY_SPREAD else valid_timetables

def get_timetables_with_some_preferences(courses, semester):
    """
    Generate timetables from all offerings (no pre-filtering of course offerings), 
    and return timetables ranked by # of preferences satisfied.
    """
    all_offerings = courses_to_offerings(courses, semester, [])
    timetables = create_timetable_from_offerings(all_offerings, WITH_CONFLICTS)
    s = sorted(timetables, key=functools.partial(get_rank_score, metric=get_preference_score))
    return s

# currently doesn't work for any constructor other than the iterative one
def create_timetable_from_offerings(offerings, with_conflicts):
    timetables = []
    for timetable in offerings_to_timetables(offerings, with_conflicts):
        if len(timetables) > MAX_RETURN:
            break
        timetables.append(timetable)
    return timetables

def rank_by_spread(timetables):
    return sorted(timetables, 
                key=functools.partial(get_rank_score, metric=get_spread_score), 
                reverse=SPREAD)

def get_rank_score(timetable, metric):
    """Get score for a timetable. The higher the score, the more grouped it is."""
    day_to_usage = {'M': [False for i in range(14 * 60 / get_granularity(SCHOOL))], 
                    'T': [False for i in range(14 * 60 / get_granularity(SCHOOL))], 
                    'W': [False for i in range(14 * 60 / get_granularity(SCHOOL))], 
                    'R': [False for i in range(14 * 60 / get_granularity(SCHOOL))], 
                    'F': [False for i in range(14 * 60 / get_granularity(SCHOOL))]}
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

# TODO
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

# ******************************************************************************
# ****************** 3. OFFERINGS -> TIMETABLES ********************************
# ******************************************************************************

def offerings_to_timetables(sections, with_conflicts):
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
        day_to_usage = {'M': [[] for i in range(14 * 60 / get_granularity(SCHOOL))], 
                        'T': [[] for i in range(14 * 60 / get_granularity(SCHOOL))], 
                        'W': [[] for i in range(14 * 60 / get_granularity(SCHOOL))], 
                        'R': [[] for i in range(14 * 60 / get_granularity(SCHOOL))], 
                        'F': [[] for i in range(14 * 60 / get_granularity(SCHOOL))]}
        no_conflicts = True
        for i in xrange(len(sections)): # add an offering for the next section
            j = (p/num_permutations_remaining[i]) % num_offerings[i]
            day_to_usage, conflict, new_meeting = add_meeting_and_check_conflict(day_to_usage, sections[i][j])
            if conflict and not with_conflicts: # there's a conflict and we don't want to consider it
                no_conflicts = False
                break
            current_tt.append(new_meeting)
        if no_conflicts and len(current_tt) != 0:
            if WITH_CONFLICTS: update_conflict_info(day_to_usage)
            yield tuple(current_tt)

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

def update_conflict_info(day_to_usage):
    for day in day_to_usage.keys():
        day_to_usage[day] = [sort_slot_by_startend(slot) for slot in day_to_usage[day]]
        update_day_conflicts(day_to_usage[day], 0, 14 * 60 / get_granularity(SCHOOL), 0, [])

def update_day_conflicts(day_bitarray, start, end, current_level, ignore_list):
    """
    Take a day_bitarray and update the conflict_info lists in that bit array
    to reflect the conflicts present.
    start: the time that the function starts looking from (it looks from early to late)
    end: the time that the functino stops looking at.
    current_level: the current_level that the offerings between start and end are at.
    ignore_list: 
    """
    i = start
    while i < end:
        if day_bitarray[i]:
            overlapping = get_overlapping_slots(day_bitarray, i, ignore_list)

            # set correct values for the next two
            if overlapping:
                update_slots_conflict_info(overlapping, current_level)
                tail = find_latest_slot(overlapping)
                next_hour_index = i + 60 / get_granularity(SCHOOL)
                # if next_hour_index < end and exists_more_classes(overlapping, day_bitarray[next_hour_index]):
                    # recursively update the rest of slots in overlapping
                tail = update_day_conflicts(day_bitarray, next_hour_index, \
                                            tail, \
                                            current_level + 1, \
                                            overlapping + ignore_list)
                i = tail + 1
            else:
                i += 1
        else:
            i += 1
    return i

def get_overlapping_slots(day_bitarray, current_slot, ignore_list):
    """
    Retrieve the overlapping slots in a given hour, sorted by earliest start time
    then by latest end time.
    """
    overlapping = []
    for i in range(60 / get_granularity(SCHOOL)):
        overlapping += [pair for pair in day_bitarray[current_slot + i] if pair not in ignore_list and
                        pair not in overlapping]
    return sort_slot_by_startend(overlapping)


def update_slots_conflict_info(overlapping, current_level):
    """ Update the conflict info for a list of overlapping slots. """
    for index, pair in enumerate(overlapping):
        pair[1] = [current_level, len(overlapping), index]

def exists_more_classes(current_slots, next_slots):
    """Determine if there is a class in next that doesn't appear in current."""

    return bool(set(pair[0] for pair in next_slots) - set(pair[0] for pair in current_slots))

def find_latest_slot(overlapping):
    all_slot_lists = [find_slots_to_fill(co.time_start, co.time_end) for co, info in overlapping]
    return max([slots[-1] for slots in all_slot_lists])

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

def sort_slot_by_startend(slot):
    return sorted(slot, key=lambda pair: (get_hour(pair[0].time_start), 14 * 60 / get_granularity(SCHOOL) - get_hour(pair[0].time_end)))

def get_hour(str_time):
    si = str_time.index(':') if ':' in str_time else len(str_time)
    return int(str_time[:si])

# ******************************************************************************************************
# ***************************************** 4. COURSE -> OFFERINGS *************************************
# ******************************************************************************************************

def courses_to_offerings(courses, sem, plist=[]):
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
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   
    sections = []

    for c in courses:
        offerings = SchoolCourseOffering.objects.filter(~Q(time_start__iexact='TBA'), \
                                                (Q(semester=sem) | Q(semester='Y')), \
                                                course=c)
        section_to_offerings = get_section_to_offering_map(offerings)
        section_type_to_sections = get_section_type_to_sections_map(section_to_offerings, \
                                                                    plist, \
                                                                    c.id)
        for section_type in section_type_to_sections:
            locked_section = LOCKED_SECTIONS[str(c.id)][section_type]
            if locked_section: # there is a pinned offering for this section of the course
                pinned = [c.id, locked_section, section_to_offerings[locked_section]]
                sections.append([pinned])
            else:
                sections.append(section_type_to_sections[section_type])
    # sections.sort(key = lambda l: len(l), reverse=False)
    return sections

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

def construct_preference_tt():
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
    if (NO_CLASSES_BEFORE > 0 or NO_CLASSES_AFTER < 14 * 60/get_granularity(SCHOOL)):
        tt.append([lambda co: not (get_time_index_from_string(co[0].time_start) > NO_CLASSES_BEFORE \
                            and get_time_index_from_string(co[0].time_end) < NO_CLASSES_AFTER)])

    # long weekend preference 
    if LEAST_DAYS:
        tt.append([(lambda co: co[0].day == 'T'), \
                    (lambda co: co[0].day == 'W'), \
                    (lambda co: co[0].day == 'R'), \
                    (lambda co: co[0].day == 'M'), \
                    (lambda co: co[0].day == 'F')])
    
    elif LONG_WEEKEND:
        tt.append([(lambda co: co[0].day == 'M'), \
                    (lambda co: co[0].day == 'F')])

    # break time preference
    if BREAK_TIMES:
        break_periods = [BREAK_TIMES[i:i+BREAK_LENGTH] for i in range(len(BREAK_TIMES) - BREAK_LENGTH + 1)]
        break_possibilities = [(lambda co: not (get_time_index_from_string(co[0].time_start) > periods[-1] \
                                            and get_time_index_from_string(co[0].time_end) < periods[0])) \
                                for periods in break_periods]
        tt.append(break_possibilities)

    return tt

def get_time_index_from_string(s):
    """Find the time index based on course offering string (e.g. 8:30 -> 2)"""
    return get_time_index(*get_hours_minutes(s))

def get_time_index(hours, minutes):
    """Take number of hours and minutes, and return the corresponding time slot index"""
    # earliest possible hour is 8, so we get the number of hours past 8am
    return (hours - 8) * (60 / get_granularity(SCHOOL)) + \
            minutes / get_granularity(SCHOOL)

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
def do_all(request):
    write_courses_to_json(request, "uoft", "F")
    write_courses_to_json(request, "uoft", "S")
    write_courses_to_json(request, "jhu", "F")
    write_courses_to_json(request, "jhu", "S")
    return HttpResponse("Success!")


def write_courses_to_json(request, school, sem):
    school = school.lower()
    sem = sem.upper()
    if (school not in ["jhu", "uoft"]) or (sem not in ["F", "S"]):
        json_data = []
    else:
        module_dir = os.path.dirname(__file__)  # get current directory
        file_path = os.path.join(module_dir, "courses_json/" + school + "-" + sem + ".json")

        global SCHOOL
        SCHOOL = school
        C, Co = get_correct_models(school)[0], get_correct_models(school)[1]
        course_objs = C.objects.all()
        json_data = convert_courses_to_json(course_objs, sem, 50000)
        with open(file_path, 'w') as outfile:
            json.dump(json_data, outfile)



def get_courses(request, school, sem):
    school = school.lower()
    sem = sem.upper()
    if (school not in ["jhu", "uoft"]) or (sem not in ["F", "S"]):
        json_data = []
    else:
        module_dir = os.path.dirname(__file__)  # get current directory
        file_path = os.path.join(module_dir, 
            "courses_json/" + school + "-" + sem + ".json")
        data = open(file_path).read()
        json_data = json.loads(data)

    return HttpResponse(json.dumps(json_data), content_type="application/json")

def get_course(request, school, id):
    from time import sleep
    global SCHOOL
    school = school.lower()
    if school in ["uoft", "jhu"]:
        SCHOOL = school
    try:
        models = get_correct_models(school)
        C, Co = models[0], models[1]
        course = C.objects.get(id=id)
        json_data = model_to_dict(course)
        json_data['sections_F'] = get_meeting_sections(course,'F')
        json_data['sections_S'] = get_meeting_sections(course,'S')
        json_data['sections_F_objs'] = get_meeting_sections_objects(course, 'F')
        json_data['sections_S_objs'] = get_meeting_sections_objects(course, 'S')
        json_data['textbook_info'] = course.get_all_textbook_info()
        json_data['eval_info'] = course.get_eval_info()
        json_data['related_courses'] = course.get_related_course_info()
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
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   
    offering_objs = SchoolCourseOffering.objects.filter((Q(semester=semester) | Q(semester='Y')), 
                                                    course=course)          
    sections = []
    for o in offering_objs:
        if o.meeting_section not in sections:
            sections.append(o.meeting_section)
    sections.sort()
    return sections

def get_meeting_sections_objects(course, semester):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   
    offering_objs = SchoolCourseOffering.objects.filter((Q(semester=semester) | Q(semester='Y')), 
                                                    course=course)          
    sections = []
    for o in offering_objs:
        if o.meeting_section not in sections:
            sections.append(model_to_dict(o))
    sections.sort()
    return sections

def has_offering(course, sem):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   

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

