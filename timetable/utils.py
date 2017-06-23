import itertools
from collections import namedtuple
from operator import itemgetter

from courses.utils import get_sections_by_section_type
from timetable.models import Section, Course, Semester
from timetable.school_mappers import school_to_granularity, school_to_semesters, \
    old_school_to_semesters
from timetable.scoring import get_tt_cost, get_num_days, get_avg_day_length, get_num_friends, \
    get_avg_rating


MAX_RETURN = 60  # Max number of timetables we want to consider

def courses_to_timetables(courses, locked_sections, semester, sort_metrics, school, custom_events, with_conflicts, optional_course_ids):
    all_offerings = courses_to_offerings(courses, locked_sections, semester)
    tts_by_score =  sorted(itertools.islice(
        offerings_to_timetables(all_offerings, school, custom_events, with_conflicts,
                                optional_course_ids),
        MAX_RETURN
    ), key=lambda tt_pair: get_tt_cost(tt_pair[0], sort_metrics))
    return [tt for (tt, stats) in tts_by_score]


def courses_to_offerings(courses, locked_sections, semester):
    """
    Take a list of courses and group all of the courses' offerings by section
    type. Returns a list of lists (for each group), where each offering is represented as a
    [course_id, section_code, [CourseOffering]] triple.
    """
    all_sections = []
    for course in courses:
        grouped = get_sections_by_section_type(course, semester)
        for section_type, sections in grouped.iteritems():
            locked_section_code = locked_sections.get(str(course.id), {}).get(section_type)
            section_codes = [section.meeting_section for section in sections]
            if locked_section_code in section_codes:
                locked_section = next(s for s in sections
                                      if s.meeting_section == locked_section_code)
                pinned = [course, locked_section, locked_section.offering_set.all()]
                all_sections.append([pinned])
            else:
                all_sections.append(
                    [[course, section, section.offering_set.all()] for section in sections])
    return all_sections


# TODO: use namedtuple instead of tuple
def offerings_to_timetables(sections, school, custom_events, with_conflicts, optional_course_ids):
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
    for p in xrange(total_num_permutations):  # for each possible tt
        current_tt = []
        day_to_usage = get_day_to_usage(custom_events, school)
        num_conflicts = 0
        add_tt = True
        for i in xrange(len(sections)):  # add an offering for the next section
            j = (p / num_permutations_remaining[i]) % num_offerings[i]
            num_added_conflicts = add_meeting_and_check_conflict(day_to_usage,
                                                                 sections[i][j],
                                                                 school)
            num_conflicts += num_added_conflicts
            if num_conflicts and not with_conflicts:
                add_tt = False
                break
            current_tt.append(sections[i][j])
        if add_tt and len(current_tt) != 0:
            tt_stats = get_tt_stats(current_tt, day_to_usage)
            tt_stats['num_conflicts'] = num_conflicts
            tt_stats['has_conflict'] = bool(num_conflicts)
            yield convert_to_model(current_tt, tt_stats, optional_course_ids, school)


def convert_to_model(timetable, tt_stats, optional_course_ids, school):
    courses, sections = zip(*[(course, section) for course, section, _ in timetable])
    courses = list(set(courses))

    tt = Timetable(courses, sections, tt_stats['has_conflict'])
    return (tt, tt_stats)


def update_locked_sections(locked_sections, cid, locked_section):
    """
    Take cid of new course, and locked section for that course
    and toggle its locked status (ie if was locked, unlock and vice versa.
    """
    section_type = Section.objects.filter(
        course=cid, meeting_section=locked_section)[0].section_type
    if locked_sections[cid].get(section_type, '') == locked_section:  # already locked
        locked_sections[cid][section_type] = ''  # unlock that section_type
    else:  # add as locked section for that section_type
        locked_sections[cid][section_type] = locked_section


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


def add_meeting_and_check_conflict(day_to_usage, new_meeting, school):
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
            for slot in find_slots_to_fill(offering.time_start, offering.time_end, school):
                previous_len = max(1, len(day_to_usage[day][slot]))
                day_to_usage[day][slot].add(offering)
                new_conflicts += len(day_to_usage[day][slot]) - previous_len
    return new_conflicts


def find_slots_to_fill(start, end, school):
    """
    Take a @start and @end time in the format found in the coursefinder (e.g. 9:00, 16:30),
    and return the indices of the slots in thet array which represents times from 8:00am
    to 10pm that would be filled by the given @start and @end. For example, for uoft
    input: '10:30', '13:00'
    output: [5, 6, 7, 8, 9]
    """
    start_hour, start_minute = get_hours_minutes(start)
    end_hour, end_minute = get_hours_minutes(end)

    return range(get_time_index(start_hour, start_minute, school),
                 get_time_index(end_hour, end_minute, school))


def get_time_index(hours, minutes, school):
    """Take number of hours and minutes, and return the corresponding time slot index"""
    # earliest possible hour is 8, so we get the number of hours past 8am
    return (hours - 8) * (60 /
                          school_to_granularity[school]) + minutes / school_to_granularity[school]


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
    return int(time_string[:time_string.index(':')]) if ':' in time_string else int(time_string)


def get_minute_from_string_time(time_string):
    """Get minute as an int from time as a string."""
    return int(time_string[time_string.index(':') + 1:] if ':' in time_string else 0)


def get_tt_stats(timetable, day_to_usage):
    return {
        'days_with_class': get_num_days(day_to_usage),
        'time_on_campus': get_avg_day_length(day_to_usage),
        'num_friends': get_num_friends(timetable),
        'avg_rating': get_avg_rating(timetable)
    }


def get_day_to_usage(custom_events, school):
    """Initialize day_to_usage dictionary, which has custom events blocked out."""
    day_to_usage = {
        'M': [set() for _ in range(14 * 60 / school_to_granularity[school])],
        'T': [set() for _ in range(14 * 60 / school_to_granularity[school])],
        'W': [set() for _ in range(14 * 60 / school_to_granularity[school])],
        'R': [set() for _ in range(14 * 60 / school_to_granularity[school])],
        'F': [set() for _ in range(14 * 60 / school_to_granularity[school])]
    }

    for event in custom_events:
        for slot in find_slots_to_fill(event['time_start'], event['time_end'], school):
            day_to_usage[event['day']][slot].add('custom_slot')

    return day_to_usage


def get_current_semesters(school):
    """
    For a given school, get the possible semesters and the most recent year for each
    semester that has course data, and return a list of (semester name, year) pairs.
    """
    semesters = school_to_semesters[school]
    old_semesters = school_to_semesters[school]
    # Ensure DB has all semesters.
    all_semesters = set()
    for semester in semesters:
        all_semesters.add(Semester.objects.update_or_create(**semester)[0])
    return sorted([{'name': s.name, 'year': s.year} for s in all_semesters],
                  key=itemgetter('year'), reverse=True)


def get_old_semesters(school):
    semesters = old_school_to_semesters[school]
    # Ensure DB has all semesters.
    for semester in semesters:
        Semester.objects.update_or_create(**semester)
    return semesters


# TODO: delete after deleting convert_tt_to_dict
def get_tt_rating(course_ids):
    avgs = [Course.objects.get(id=cid).get_avg_rating()
            for cid in set([cid for cid in course_ids])]
    try:
        return min(5, sum(avgs) /
                   sum([0 if a == 0 else 1 for a in avgs]) if avgs else 0)
    except BaseException:
        return 0


Timetable = namedtuple('Timetable', 'courses sections has_conflict')