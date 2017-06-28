import itertools
from operator import itemgetter

from django.forms import model_to_dict

from courses.serializers import augment_course_dict
from courses.utils import sections_are_filled
from timetable.models import Section, Course, Semester
from timetable.school_mappers import school_to_granularity, school_to_semesters, \
    old_school_to_semesters
from timetable.scoring import get_tt_cost, get_num_days, get_avg_day_length, get_num_friends, \
    get_avg_rating

MAX_RETURN = 60  # Max number of timetables we want to consider


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
    # earliest possible hour is 8, so we get  the number of hours past 8am
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


class TimetableGenerator:
    def __init__(self,
                 semester,
                 school,
                 locked_sections,
                 custom_events,
                 preferences,
                 optional_course_ids=None):
        self.school = school
        self.slots_per_hour = 60 / school_to_granularity[school]
        self.semester = semester
        self.with_conflicts = preferences.get('try_with_conflicts', False)
        self.sort_metrics = [(m['metric'], m['order'])
                             for m in preferences.get('sort_metrics', [])
                             if m['selected']]
        self.locked_sections = locked_sections
        self.custom_events = custom_events
        self.optional_course_ids = optional_course_ids or []

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
        tt_obj['courses'] = list(itertools.starmap(augment_course_dict, grouped))
        return dict(tt_obj, **tt_stats)

    def get_basic_course_dict(self, section):
        model = Course.objects.get(id=section[0])
        course_dict = model_to_dict(model, fields='code name id num_credits department'.split())
        if section[0] in self.optional_course_ids:  # mark optional courses
            course_dict['is_optional'] = True

        course_section_list = sorted(model.section_set.filter(semester=self.semester),
                                     key=lambda s: s.section_type)
        section_type_to_sections = itertools.groupby(course_section_list, lambda s: s.section_type)
        course_dict['is_waitlist_only'] = any(sections_are_filled(sections)
                                              for _, sections in section_type_to_sections)

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
        for p in xrange(total_num_permutations):  # for each possible tt
            current_tt = []
            day_to_usage = self.get_day_to_usage()
            num_conflicts = 0
            add_tt = True
            for i in xrange(len(sections)):  # add an offering for the next section
                j = (p / num_permutations_remaining[i]) % num_offerings[i]
                num_added_conflicts = add_meeting_and_check_conflict(day_to_usage,
                                                                     sections[i][j],
                                                                     self.school)
                num_conflicts += num_added_conflicts
                if num_conflicts and not self.with_conflicts:
                    add_tt = False
                    break
                current_tt.append(sections[i][j])
            if add_tt and len(current_tt) != 0:
                tt_stats = get_tt_stats(current_tt, day_to_usage)
                tt_stats['num_conflicts'] = num_conflicts
                tt_stats['has_conflict'] = bool(num_conflicts)
                yield (tuple(current_tt), tt_stats)

    def get_day_to_usage(self):
        """Initialize day_to_usage dictionary, which has custom events blocked out."""
        day_to_usage = {
            'M': [set() for _ in range(14 * 60 / school_to_granularity[self.school])],
            'T': [set() for _ in range(14 * 60 / school_to_granularity[self.school])],
            'W': [set() for _ in range(14 * 60 / school_to_granularity[self.school])],
            'R': [set() for _ in range(14 * 60 / school_to_granularity[self.school])],
            'F': [set() for _ in range(14 * 60 / school_to_granularity[self.school])]
        }

        for event in self.custom_events:
            for slot in find_slots_to_fill(event['time_start'], event['time_end'], self.school):
                day_to_usage[event['day']][slot].add('custom_slot')

        return day_to_usage

    def courses_to_offerings(self, courses):
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


def get_current_semesters(school):
    """
    For a given school, get the possible semesters and the most recent year for each
    semester that has course data, and return a list of (semester name, year) pairs.
    """
    terms_ordering = {
        'Summer': 1,
        'Winter': 2,
        'Spring': 3,
        'Fall': 4,
    }
    semesters = school_to_semesters[school]
    old_semesters = school_to_semesters[school]
    # Ensure DB has all semesters.
    all_semesters = set()
    for semester in semesters:
        all_semesters.add(Semester.objects.update_or_create(**semester)[0])
    return sorted([{'name': s.name, 'year': s.year} for s in all_semesters],
                  key=lambda s: (s['year'], terms_ordering.get(s['name'],0)),
                  reverse=True)


def get_old_semesters(school):
    semesters = old_school_to_semesters[school]
    # Ensure DB has all semesters.
    for semester in semesters:
        Semester.objects.update_or_create(**semester)
    return semesters


def get_tt_rating(course_ids):
    avgs = [Course.objects.get(id=cid).get_avg_rating()
            for cid in set([cid for cid in course_ids])]
    try:
        return min(5, sum(avgs) /
                   sum([0 if a == 0 else 1 for a in avgs]) if avgs else 0)
    except BaseException:
        return 0