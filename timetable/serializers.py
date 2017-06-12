import itertools

from django.forms import model_to_dict

from student.models import PersonalTimetable
from timetable.utils import get_tt_rating
from courses.utils import sections_are_filled
from courses.serializers import get_section_dict


def convert_tt_to_dict(timetable, include_last_updated=True):
    """
    Converts @timetable, which is expected to be an instance of PersonalTimetable or SharedTimetable, to a dictionary representation of itself.
    This dictionary representation corresponds to the JSON sent back to the frontend when timetables are generated.
    """
    courses = []
    course_ids = []
    tt_dict = model_to_dict(timetable)
    # include the 'last_updated' property by default; won't be included for
    # SharedTimetables (since they don't have the property)
    if include_last_updated:
        tt_dict['last_updated'] = str(timetable.last_updated)

    for section_obj in timetable.sections.all():
        c = section_obj.course  # get the section's course
        c_dict = model_to_dict(c)

        if c.id not in course_ids:  # if not in courses, add to course dictionary with co
            c_dict = model_to_dict(c)
            courses.append(c_dict)
            course_ids.append(c.id)
            courses[-1]['slots'] = []
            courses[-1]['enrolled_sections'] = []
            courses[-1]['textbooks'] = {}
            courses[-1]['is_waitlist_only'] = False

        index = course_ids.index(c.id)
        courses[index]['slots'].extend(
            [dict(get_section_dict(section_obj), **model_to_dict(co)) for co in section_obj.offering_set.all()])
        courses[index]['textbooks'][section_obj.meeting_section] = section_obj.get_textbooks()

        courses[index]['enrolled_sections'].append(section_obj.meeting_section)

    for course_obj in timetable.courses.all():
        course_section_list = sorted(course_obj.section_set.filter(semester=timetable.semester),
                                     key=lambda s: s.section_type)
        section_type_to_sections = itertools.groupby(
            course_section_list, lambda s: s.section_type)
        if course_obj.id in course_ids:
            index = course_ids.index(course_obj.id)
            courses[index]['is_waitlist_only'] = any(
                sections_are_filled(sections) for _, sections in section_type_to_sections)

    tt_dict['courses'] = courses
    tt_dict['avg_rating'] = get_tt_rating(course_ids)
    if isinstance(timetable, PersonalTimetable):
        tt_dict['events'] = [dict(model_to_dict(event), preview=False)
                             for event in timetable.events.all()]
    return tt_dict