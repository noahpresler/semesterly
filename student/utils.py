import datetime

from django.core.signing import TimestampSigner
from django.db.models import Q
from django.forms import model_to_dict
from hashids import Hashids

from student.models import Student, PersonalTimetable
from timetable.models import Course
from timetable.serializers import DisplayTimetableSerializer
from timetable.utils import DisplayTimetable

DAY_LIST = ['M', 'T', 'W', 'R', 'F', 'S', 'U']

hashids = Hashids(salt="***REMOVED***")


def next_weekday(d, weekday):
    d = d - datetime.timedelta(days=1)
    days_ahead = DAY_LIST.index(weekday) - d.weekday()
    if days_ahead <= 0:  # Target day already happened this week
        days_ahead += 7
    return d + datetime.timedelta(days_ahead)


def get_student(request):
    logged = request.user.is_authenticated()
    if logged and Student.objects.filter(user=request.user).exists():
        return Student.objects.get(user=request.user)
    else:
        return None


def get_classmates_from_course_id(
        school, student, course_id, semester, friends=None, include_same_as=False):
    if not friends:
        friends = student.friends.filter(social_courses=True)
    course = {'course_id': course_id}
    past_ids = [course_id]
    if include_same_as:
        c = Course.objects.get(id=course_id)
        if c.same_as:
            past_ids.append(c.same_as.id)
    curr_ptts = PersonalTimetable.objects.filter(student__in=friends, courses__id__exact=course_id) \
        .filter(Q(semester=semester)).order_by('student', 'last_updated').distinct('student')
    past_ptts = PersonalTimetable.objects.filter(student__in=friends, courses__id__in=past_ids) \
        .exclude(student__in=curr_ptts.values_list('student', flat=True)).filter(~Q(semester=semester)) \
        .order_by('student', 'last_updated').distinct('student')

    return {
        'current': get_classmates_from_tts(student, course_id, curr_ptts),
        'past': get_classmates_from_tts(student, course_id, past_ptts),
    }


def get_classmates_from_tts(student, course_id, tts):
    classmates = []
    for tt in tts:
        friend = tt.student
        classmate = model_to_dict(friend, exclude=['user', 'id', 'fbook_uid', 'friends', 'time_accepted_tos'])
        classmate['first_name'] = friend.user.first_name
        classmate['last_name'] = friend.user.last_name
        if student.social_offerings and friend.social_offerings:
            friend_sections = tt.sections.filter(course__id=course_id)
            sections = list(friend_sections.values_list('meeting_section', flat=True).distinct())
            classmate['sections'] = sections
        else:
            classmate['sections'] = []
        classmates.append(classmate)
    return classmates


def make_token(student):
    return TimestampSigner().sign(student.id)


def get_student_tts(student, school, semester):
    timetables = student.personaltimetable_set.filter(
        school=school, semester=semester).order_by('-last_updated')
    return DisplayTimetableSerializer.from_model(timetables, many=True).data
