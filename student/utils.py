import datetime
import itertools

from django.core.signing import TimestampSigner
from django.forms import model_to_dict
from hashids import Hashids

from django.db.models import Q

from authpipe.utils import get_google_credentials
from student.models import Student, PersonalTimetable
from timetable.models import Course


DAY_LIST = ['M', 'T', 'W', 'R', 'F', 'S', 'U']

hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")

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


def get_classmates_from_course_id(school, student, course_id, semester, friends=None, include_same_as=False):
    if not friends:
        # All friends with social courses/sharing enabled
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

    course['classmates'] = get_classmates_from_tts(student, course_id, curr_ptts)
    course['past_classmates'] = get_classmates_from_tts(student, course_id, past_ptts)

    return course


def get_avg_rating(course_ids):
    avgs = [Course.objects.get(id=cid).get_avg_rating() \
            for cid in set([cid for cid in course_ids])]
    try:
        return min(5, sum(avgs) / sum([0 if a == 0 else 1 for a in avgs]) if avgs else 0)
    except:
        return 0


def get_user_dict(school, student, semester):
    user_dict = {'timetables': [], 'timeAcceptedTos': None}
    if student:
        user_dict = model_to_dict(student, exclude="user id friends time_accepted_tos".split())
        user_dict["timetables"] = get_student_tts(student, school, semester)
        user_dict["userFirstName"] = student.user.first_name
        user_dict["userLastName"] = student.user.last_name

        facebook_user_exists = student.user.social_auth.filter(
            provider='facebook',
        ).exists()
        user_dict["FacebookSignedUp"] = facebook_user_exists

        google_user_exists = student.user.social_auth.filter(
            provider='google-oauth2',
        ).exists()
        user_dict["GoogleSignedUp"] = google_user_exists
        user_dict["GoogleLoggedIn"] = False
        user_dict['LoginToken'] = make_token(student).split(":", 1)[1]
        user_dict['LoginHash'] = hashids.encrypt(student.id)
        user_dict["timeAcceptedTos"] = student.time_accepted_tos.isoformat() \
            if student.time_accepted_tos else None
        if google_user_exists:
            credentials = get_google_credentials(student)
            user_dict["GoogleLoggedIn"] = not (credentials is None or credentials.invalid)

    user_dict["isLoggedIn"] = student is not None

    return user_dict


def convert_tt_to_dict(timetable, include_last_updated=True):
    """
    Converts @timetable, which is expected to be an instance of PersonalTimetable or SharedTimetable, to a dictionary representation of itself.
    This dictionary representation corresponds to the JSON sent back to the frontend when timetables are generated.
    """
    courses = []
    course_ids = []
    tt_dict = model_to_dict(timetable)
    if include_last_updated:  # include the 'last_updated' property by default; won't be included for SharedTimetables (since they don't have the property)
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
        section_type_to_sections = itertools.groupby(course_section_list, lambda s: s.section_type)
        if course_obj.id in course_ids:
            index = course_ids.index(course_obj.id)
            courses[index]['is_waitlist_only'] = any(
                sections_are_filled(sections) for _, sections in section_type_to_sections)

    tt_dict['courses'] = courses
    tt_dict['avg_rating'] = get_avg_rating(course_ids)
    if isinstance(timetable, PersonalTimetable):
        tt_dict['events'] = [dict(model_to_dict(event), preview=False) for event in timetable.events.all()]
    return tt_dict


def sections_are_filled(sections):
    return all(section.enrolment >= section.size for section in sections)


def get_section_dict(section):
    section_data = model_to_dict(section)
    section_data['is_section_filled'] = section.enrolment >= section.size
    return section_data


def get_classmates_from_tts(student, course_id, tts):
    classmates = []
    for tt in tts:
        friend = tt.student
        classmate = model_to_dict(friend, exclude=['user', 'id', 'fbook_uid', 'friends'])
        classmate['first_name'] = friend.user.first_name
        classmate['last_name'] = friend.user.last_name
        if student.social_offerings and friend.social_offerings:
            friend_sections = tt.sections.filter(course__id=course_id)
            sections = list(friend_sections.values_list('meeting_section', flat=True).distinct())
            classmate['sections'] = sections
        classmates.append(classmate)
    return classmates


def make_token(student):
    return TimestampSigner().sign(student.id)


def get_student_tts(student, school, semester):
    tts = student.personaltimetable_set.filter(
        school=school, semester=semester).order_by('-last_updated')
    tts_list = [convert_tt_to_dict(tt) for tt in tts]
    return tts_list
