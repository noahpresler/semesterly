from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.context_processors import csrf
from django.utils import timezone
from django.conf import settings
from django.template import RequestContext
from django.contrib import messages
import datetime, math
from itertools import chain

from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from timetable.models import Course, CourseOffering, HopkinsCourse, HopkinsCourseOffering
from analytics.models import *

from django.forms.models import model_to_dict

from django.db.models import Q
from hashids import Hashids

from collections import OrderedDict, defaultdict
import json, copy, re, operator, itertools, functools

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

hashid = Hashids("x98as7dhg&h*askdj^has!kj?xz<!9")

# ******************************************************************************
# ******************************** COURSE SEARCH *******************************
# ******************************************************************************

def tt_course_search(request):
    """Query the database for a user's search terms"""
    if 'searchQuery' in request.GET:
        return get_results(request)
    else:
        raise Http404

def get_results(request):
    global SCHOOL # currently, either the string 'uoft' or 'jhu'

    SCHOOL = request.GET['school']
    search_query = request.GET['searchQuery']
    sem = request.GET['semester']
    sid = request.GET['u_sid']


    campuses = [str(c) for c in request.GET.getlist('campuses[]')]
    
    # Analytics
    str_campuses = ' '.join(map(str, campuses))
    # save_search_analytics(sid, search_query, sem, str_campuses)
    # End analytics
    course_objects = get_courses_from_db(search_query, campuses)
    json_data = convert_courses_to_json(course_objects, sem)
    return HttpResponse(json.dumps(json_data), content_type="application/json")

def save_search_analytics(sid, search_query, sem, str_campuses):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   

    try:
        s = SchoolQuery(session=Session.objects.get(session_id=sid),
                        query = search_query[:20],
                        cur_semester=sem,
                        cur_campuses=str_campuses)
        s.save()
    except:
        pass

def get_correct_models(school):
    if not school:
        school = "uoft"

    if school == 'uoft':
        return (Course, CourseOffering, SearchQuery, Timetable)
    elif school == 'jhu':
        return (HopkinsCourse, HopkinsCourseOffering, HopkinsSearchQuery, HopkinsTimetable)

def get_granularity(school):
    if school == 'uoft':
        return 30
    elif school == 'jhu':
        return 5

def get_courses_from_db(search_query, campuses):
    if is_empty_query(search_query):
        return []
    elif is_department_code(search_query):
        return search_by_dept_code(search_query, campuses)
    else:
        return do_full_search(search_query, campuses)

def search_by_dept_code(search_query, campuses):
    code_startswith_query = Q(code__istartswith=search_query)
    code_contains_query = Q(code__icontains=search_query)
    name_contains_query = Q(name__icontains=search_query)
    is_valid_campus = reduce(operator.or_, (Q(campus=c) for c in campuses))

    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   

    quick_results = SchoolCourse.objects.filter(code_startswith_query &\
                                                is_valid_campus)\
                                                .order_by('code')
    if len(quick_results) > 0:
        return quick_results
    else:
        return SchoolCourse.objects.filter((code_contains_query | name_contains_query) &\
                                    is_valid_campus)\
                                    .order_by('code') \

def do_full_search(search_query, campuses):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   

    any_contains_query = Q(code__icontains=search_query) |\
                        Q(name__icontains=search_query)
    description_only_query = Q(description__icontains=search_query)
    is_valid_campus = reduce(operator.or_, (Q(campus=c) for c in campuses))
    title_matches = SchoolCourse.objects.filter(any_contains_query &\
                                is_valid_campus)\
                                .order_by('code')
    description_matches = SchoolCourse.objects.filter(description_only_query &\
                                is_valid_campus)\
                                .order_by('code')
    return list(chain(title_matches,description_matches))


def is_empty_query(search_query):
    return len(search_query) == 0

def is_department_code(search_query):
    return len(search_query) <= 3

def convert_courses_to_json(courses, sem):
    cs = []
    result_count = 0    # limiting the number of results one search query can provide to 50
    for course in courses:
        if result_count == 50: break
        if has_offering(course, sem):
            cs.append(course)
            result_count += 1
    return [get_course_dict(course, sem) for course in cs]

def filter_empty_courses(courses, sem):
    """Filter out courses which have no offerings in the database."""
    return filter(functools.partial(has_offering, sem=sem), courses)

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

def get_course_dict(course, sem):
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

def is_lecture(meeting_section_name):
    return meeting_section_name[0] not in ['T', 'P']

# ******************************************************************************
# ******************************** GENERATE TTs ********************************
# ******************************************************************************

@csrf_exempt
def view_timetable(request):
    global SCHOOL
    """Generate best timetables given the user's selected courses"""
    if 'courses[]' in request.POST:
        SCHOOL = request.POST['school']
        SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   
        try:
            course_list = [SchoolCourse.objects.get(id=hashid.decrypt(key)[0]) 
                            for key in request.POST.getlist('courses[]')]
            set_locked_sections_preferences(request)
        except:  # invalid data passed in from URL
            return HttpResponse(json.dumps([]), content_type="application/json")
        if course_list == []: 
            return HttpResponse(json.dumps([]), content_type="application/json")

        set_tt_preferences(request)
        result = courses_to_timetables(course_list, request.POST['semester'])

        if returned_conflict(result, request): # Conflict in courses passed from URL
            return HttpResponse(json.dumps([]), content_type="application/json") 
        else:
            # save_tt_analytics(request, course_list, result)
            return HttpResponse(json.dumps(result), content_type="application/json")
    return render_to_response('timetable.html', {}, 
        context_instance=RequestContext(request))

def set_locked_sections_preferences(request):
    for key in request.POST.getlist('courses[]'):
        if contains_locked_sections(request, key):
            add_locked_sections(request, key)

def contains_locked_sections(request, key):
    return request.POST['sections[{0!s}]'.format(hashid.decrypt(key)[0])]

def add_locked_sections(request, key):
    global LOCKED_SECTIONS
    LOCKED_SECTIONS.append((hashid.decrypt(key)[0], 
                            request.POST['sections[{0!s}]'.format(hashid.decrypt(key)[0])]))

def returned_conflict(tt, request):
    return tt == [None] and request.POST['novel']=='true'

def set_tt_preferences(request):
    global NO_CLASSES_BEFORE, NO_CLASSES_AFTER, SORT_BY_SPREAD, LONG_WEEKEND
    global SPREAD, WITH_CONFLICTS
    slots_per_hour = 60 / get_granularity(SCHOOL)
    NO_CLASSES_BEFORE = 0 if request.POST['no_classes_before'] == "false" else slots_per_hour * 2 - 1
    NO_CLASSES_AFTER = slots_per_hour * 14 if request.POST['no_classes_after'] == "false" else slots_per_hour * 10 + 1
    LONG_WEEKEND = True if request.POST['long_weekend'] == 'true' else False
    SPREAD = False if request.POST['grouped'] == 'true' else True
    SORT_BY_SPREAD = True if request.POST['do_ranking'] == 'true' else False
    WITH_CONFLICTS = True if request.POST['try_with_conflicts'] == 'true' else False

def save_tt_analytics(request, course_list, result):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   
    try:
        analytics_tt = SchoolTimetable(session=Session.objects.get(session_id=request.POST['u_sid']))
        analytics_tt.save()
        for c in course_list: 
            analytics_tt.courses.add(c)
        analytics_tt.is_conflict = True if result == [None] else False
        analytics_tt.save()
    except:
        pass

# ******************************************************************************
# ************************** COURSES -> TTs ************************************
# ******************************************************************************

def courses_to_timetables(courses, semester):
    timetables = get_best_timetables(courses, semester)
    reset_preferences()
    result = [convert_tt_to_dict(tt) for tt in timetables]
    return result if not contains_conflict(timetables, courses) else [None]

def reset_preferences():
    global WITH_CONFLICTS, LOCKED_SECTIONS
    WITH_CONFLICTS = False
    LOCKED_SECTIONS = []

def convert_tt_to_dict(timetable):
    return [get_section_info(section) for section in timetable]

def get_section_info(section):
    SchoolCourse, SchoolCourseOffering, SchoolQuery, SchoolTimetable = get_correct_models(SCHOOL)   

    section_id, section_code, course_offerings = section
    course_dict = model_to_dict(SchoolCourse.objects.get(id=section_id), 
                                fields=['code', 'name', 'id'])
    co_dicts = [get_offering_dict(co, course_dict['code'], 
                                course_dict['name'], course_dict['id']) 
                for co in course_offerings]
    return [course_dict, section_code, co_dicts]

def contains_conflict(timetables, courses):
    return timetables == [] and len(courses) > 1

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


# TODO ROHAN: move some of this work to front end
# TODO ROHAN: Add docstring, break into smaller functions
def get_offering_dict(co_pair, code, name, course_id):
    co = co_pair[0]
    start_hour, start_minute = get_hours_minutes(co.time_start)
    end_hour, end_minute = get_hours_minutes(co.time_end)

    start_index = get_time_index(start_hour, start_minute)
    end_index = get_time_index(end_hour, end_minute)

    full_start = get_12hr_time(start_hour, start_minute)
    full_end = get_12hr_time(end_hour, end_minute)

    new = {}
    new['start_index'] = get_frontend_index(start_index)
    new['end_index'] = get_frontend_index(end_index)
    new['duration'] = (end_hour + end_minute / 60.0) - \
                        (start_hour + start_minute / 60.0) 
    new['full_time'] = full_start + " - " + full_end
    new['code'] = code  
    new['name'] = name
    new['course_id'] = course_id

    # stuff directly from the course offering itself
    new['id'] = co.id
    new['section'] = co.meeting_section
    new['location'] = co.location
    new['day'] = co.day
    new['instructors'] = co.instructors
    new['depth_level'] = co_pair[1][0]
    new['num_conflicts'] = co_pair[1][1]
    new['shift_index'] = co_pair[1][2]

    return [new]

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

def get_12hr_time(hours, minutes):
    """Convert hours and minutes to time string in 12hr format"""
    hour_str = str(hours - 12) if hours > 12 else str(hours)
    minute_str = '' if minutes == 0 else ':' + str(minutes)
    return hour_str + minute_str

# NOTE: currently assumes that the minute is a multiple of 5
def get_time_index(hours, minutes):
    """Take number of hours and minutes, and return the corresponding time slot index"""
    # earliest possible hour is 8, so we get the number of hours past 8am
    return (hours - 8) * (60 / get_granularity(SCHOOL)) + \
            minutes / get_granularity(SCHOOL)

def get_frontend_index(index):
    """
    Take a backend time index (e.g. 12, out of a size 28 array for uoft) and
    calculate the number of half hour slots needed to represent it on the frontend
    """
    return index * 2 / (60 / get_granularity(SCHOOL))

def get_time_index_from_string(s):
    """Find the time index based on course offering string (e.g. 8:30 -> 2)"""
    return get_time_index(*get_hours_minutes(s))

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
        # if day =='W':
        #   for slot in day_to_usage[day]:
        #       print slot

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
            section_codes = [sid for cid, sid, colist in section_type_to_sections[section_type]]
            s = get_locked_section(c.id, section_codes)
            if s: # this section is locked, only append the locked one
                sections.append([[c.id, s, section_to_offerings[s]]])
            else: 
                sections.append(section_type_to_sections[section_type])
    # sections.sort(key = lambda l: len(l), reverse=False)
    return sections

def get_section_type_to_sections_map(section_to_offerings, plist, cid):
    section_type_to_sections = {offerings[0][0].section_type: [] for section, offerings in section_to_offerings.iteritems()}
    for section, offerings in section_to_offerings.iteritems():
        if not violates_any_preferences(offerings, plist):
            # section_type for all offerings for a given section should be the same,
            # so we just take the first one
            section_type = offerings[0][0].section_type
            section_type_to_sections[section_type].append([cid, \
                                                        section, \
                                                        section_to_offerings[section]])
    return section_type_to_sections

def violates_any_preferences(offerings, plist):
    return any([check_co_against_preferences(plist, co) for co in offerings])

def get_section_to_offering_map(offerings):
    section_to_offerings = OrderedDict()
    for offering in offerings:
        section_code = offering.meeting_section
        if section_to_offerings.get(section_code): # section already in dict
            section_to_offerings[section_code].append([offering, [0, 1, 0]])
        else: # new section
            section_to_offerings[section_code] = [[offering, [0, 1, 0]]]
    return section_to_offerings

def get_locked_section(course_id, section_codes):
    for cid, section_code in LOCKED_SECTIONS:
        if course_id == cid and section_code in section_codes:
            return section_code
    else:
        return None 

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
