from django.forms import model_to_dict
from rest_framework import serializers

from courses.serializers import get_section_dict, OldCourseSerializer, SemesterSerializer
from courses.utils import is_waitlist_only
from student.models import PersonalTimetable
from timetable.utils import get_tt_rating


def convert_tt_to_dict(timetable):
    """
    Converts @timetable, which is expected to be an instance of PersonalTimetable or SharedTimetable, to a dictionary representation of itself.
    This dictionary representation corresponds to the JSON sent back to the frontend when timetables are generated.
    """
    courses = []
    course_ids = []
    tt_dict = model_to_dict(timetable)

    for section_obj in timetable.sections.all():
        c = section_obj.course  # get the section's course

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
        if course_obj.id in course_ids:
            index = course_ids.index(course_obj.id)
            courses[index]['is_waitlist_only'] = is_waitlist_only(course_obj, timetable.semester)

    tt_dict['courses'] = courses
    tt_dict['avg_rating'] = get_tt_rating(course_ids)
    if isinstance(timetable, PersonalTimetable):
        tt_dict['events'] = [dict(model_to_dict(event), preview=False)
                             for event in timetable.events.all()]
    return tt_dict


# TODO: move slots into its own field
# TODO: validate data
class TimetableSerializer(serializers.Serializer):
    has_conflict = serializers.BooleanField()

    # Send full courses so that correct data can be merged with entities
    # TODO: only need to send one set of full course data with each response
    courses = serializers.SerializerMethodField()
    # send slots for this specific timetable
    slots = serializers.SerializerMethodField()

    semester = serializers.SerializerMethodField()
    school = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    events = serializers.SerializerMethodField()

    # TODO: send separately, once per request
    def get_courses(self, obj):
        return OldCourseSerializer(obj.courses, many=True, context={
            'school': obj.courses[0].school,
            'courses': obj.courses,
            'sections': obj.sections,
            'semester': obj.sections[0].semester,
        }).data

    def get_semester(self, obj):
        return SemesterSerializer(obj.sections[0].semester).data

    def get_school(self, obj):
        return obj.courses[0].school

    def get_avg_rating(self, obj):
        ratings_by_course = (course.get_avg_rating() for course in obj.courses)
        # TODO remove hard coded range
        valid_ratings = [rating for rating in ratings_by_course if 0 <= rating <= 5]
        return float(sum(valid_ratings)) / len(valid_ratings) if valid_ratings else 0

    def get_events(self, obj):
        return self.context.get('events')

    def get_slots(self, obj):
        return [{
            'course': section.course.id,
            'section': section.id,
            'offerings': [offering.id for offering in section.offering_set.all()]
        } for section in obj.sections]

#
#
# class SlotSerializer(serializers.Serializer):
#     course = serializers.IntegerField()
#     section = serializers.IntegerField()
#     offerings = serializers.IntegerField(many=True)
#     is_optional = serializers.BooleanField()
#     is_locked = serializers.BooleanField()
#
#
# class DisplayTimetable:
#
#     def __init__(self, slots, has_conflict):
#         self.slots = slots
#         self.has_conflict = has_conflict
#         self.name = ''
#
#     @classmethod
#     def from_personal_timetable(cls, personal_timetable):
#         pass
#
#     @classmethod
#     def from_shared_timetable(cls, shared_timetable):
#         pass
#
#
# class DisplayTimetableSerializer(serializers.Serializer):
#     slots = SlotSerializer(many=True)
#     has_conflict = serializers.BooleanField()
#     name = serializers.CharField()
