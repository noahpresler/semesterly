import json
import itertools
from datetime import datetime

from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.core.signing import TimestampSigner
from django.db.models import Q
from django.forms.models import model_to_dict
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from hashids import Hashids
import httplib2
from googleapiclient import discovery
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from analytics.models import *
from student.models import *
from student.utils import next_weekday
from timetable.models import *
from timetable.utils import *
from authpipe.utils import get_google_credentials, check_student_token


DAY_MAP = {
        'M' : 'mo',
        'T' : 'tu',
        'W' : 'we',
        'R' : 'th',
        'F' : 'fr',
        'S' : 'sa',
        'U' : 'su'
    }

hashids = Hashids(salt="***REMOVED***")

def get_student(request):
  logged = request.user.is_authenticated()
  if logged and Student.objects.filter(user=request.user).exists():
    return Student.objects.get(user=request.user)
  else:
    return None

def get_avg_rating(course_ids):
  avgs = [Course.objects.get(id=cid).get_avg_rating() \
          for cid in set([cid for cid in course_ids])]
  try:
     return min(5, sum(avgs)/sum([ 0 if a == 0 else 1 for a in avgs]) if avgs else 0)
  except:
     return 0

def get_user_dict(school, student, semester):
    user_dict = {}
    if student:
        user_dict = model_to_dict(student, exclude=["user","id","friends"])
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
        if google_user_exists:
            credentials = get_google_credentials(student)
            user_dict["GoogleLoggedIn"] = not(credentials is None or credentials.invalid)
    
    user_dict["isLoggedIn"] = student is not None

    return user_dict

@login_required
@validate_subdomain
@csrf_exempt
def get_student_tts_wrapper(request, school, sem_name, year):
    sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
    student = Student.objects.get(user=request.user)
    response = get_student_tts(student, school, sem)
    return HttpResponse(json.dumps(response), content_type='application/json')

def get_student_tts(student, school, semester):
    tts = student.personaltimetable_set.filter(
        school=school, semester=semester).order_by('-last_updated')
    # create a list containing all PersonalTimetables for this semester in their dictionary representation
    tts_list = [convert_tt_to_dict(tt) for tt in tts] # aka titty dick
    return tts_list

def sections_are_filled(sections):
    return all(section.enrolment >= section.size for section in sections)

def get_section_dict(section):
    section_data = model_to_dict(section)
    section_data['is_section_filled'] = section.enrolment >= section.size
    return section_data

def convert_tt_to_dict(timetable, include_last_updated=True):
    """
    Converts @timetable, which is expected to be an instance of PersonalTimetable or SharedTimetable, to a dictionary representation of itself.
    This dictionary representation corresponds to the JSON sent back to the frontend when timetables are generated.
    """
    courses = []
    course_ids = []
    tt_dict = model_to_dict(timetable)
    if include_last_updated: # include the 'last_updated' property by default; won't be included for SharedTimetables (since they don't have the property)
        tt_dict['last_updated'] = str(timetable.last_updated)

    for section_obj in timetable.sections.all():
        c = section_obj.course # get the section's course
        c_dict = model_to_dict(c)

        if c.id not in course_ids: #if not in courses, add to course dictionary with co
            c_dict = model_to_dict(c)
            courses.append(c_dict)
            course_ids.append(c.id)
            courses[-1]['slots'] = []
            courses[-1]['enrolled_sections'] = []
            courses[-1]['textbooks'] = {}

        index = course_ids.index(c.id)
        courses[index]['slots'].extend([merge_dicts(get_section_dict(section_obj), model_to_dict(co)) for co in section_obj.offering_set.all()])
        courses[index]['textbooks'][section_obj.meeting_section] = section_obj.get_textbooks()

        courses[index]['enrolled_sections'].append(section_obj.meeting_section)

    for course_obj in timetable.courses.all():
        course_section_list = sorted(course_obj.section_set.filter(semester=timetable.semester),
                                     key=lambda s: s.section_type)
        section_type_to_sections = itertools.groupby(course_section_list, lambda s: s.section_type)
        index = course_ids.index(course_obj.id)
        courses[index]['is_waitlist_only'] = any(sections_are_filled(sections) for _, sections in section_type_to_sections)

    tt_dict['courses'] = courses
    tt_dict['avg_rating'] = get_avg_rating(course_ids)
    return tt_dict

@csrf_exempt
@login_required
@validate_subdomain
def save_timetable(request):
    school = request.subdomain
    params = json.loads(request.body)
    courses = params['timetable']['courses']
    has_conflict = params['timetable']['has_conflict']
    name = params['name']
    semester, _ = Semester.objects.get_or_create(**params['semester'])
    student = Student.objects.get(user=request.user)
    error = {'error': 'Timetable with name already exists'}
    # if params['id'] is not provided (or params['id'] == 0) then this is a request to create a new timetable,
    # since an ID has not been created for this timetable yet
    tempId = params['id'] if params['id'] else -1
    # don't allow people to save timetables with the same name
    # two cases:
    # 1. the user is creating a new timetable with the given name,
    # in which case tempId will be -1 from above
    # 2. the user is editing the name of an existing timetable, in which
    # case tempId is the ID of that timetable, as passed from the frontend.
    # we check if a timetable with a different id has that name
    if PersonalTimetable.objects.filter(~Q(id=tempId), 
                                        student=student, 
                                        name=params['name'], 
                                        semester=semester,
                                        school=school).exists():
        return HttpResponse(json.dumps(error), content_type='application/json')

    if params['id']:
        personal_timetable = PersonalTimetable.objects.get(
            student=student, id=params['id'], school=school)
        personal_timetable.name = name
    else:
        personal_timetable = PersonalTimetable.objects.create(
            student=student, name=name, school=school, semester=semester)
    # delete currently existing courses and course offerings for this timetable
    personal_timetable.courses.clear()
    personal_timetable.sections.clear()
    personal_timetable.save()
    for course in courses:
        course_obj = Course.objects.get(id=course['id'])
        personal_timetable.courses.add(course_obj)
        enrolled_sections = course['enrolled_sections']
        for section in enrolled_sections:
            personal_timetable.sections.add(
                course_obj.section_set.get(meeting_section=section, semester=semester))
    personal_timetable.has_conflict = has_conflict
    personal_timetable.save()
    timetables = get_student_tts(student, school, semester)
    saved_timetable = (x for x in timetables if x['id'] == personal_timetable.id).next()
    response = {'timetables': timetables, 'saved_timetable': saved_timetable}

    return HttpResponse(json.dumps(response), content_type='application/json')


@csrf_exempt
@login_required
@validate_subdomain
def delete_timetable(request):
    school = request.subdomain
    params = json.loads(request.body)
    name = params['name']
    semester = Semester.objects.get(id=params['semester'])
    student = Student.objects.get(user=request.user)

    PersonalTimetable.objects.filter(
        student=student, name=name, school=school, semester=semester).delete()

    timetables = get_student_tts(student, school, semester)
    response = {'timetables': timetables}
    return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
@login_required
@validate_subdomain
def duplicate_timetable(request):
    school = request.subdomain
    params = json.loads(request.body)
    tt = params['timetable']
    name = tt['name']
    semester = Semester.objects.get(id=tt['semester'])
    student = Student.objects.get(user=request.user)
    new_name = params['name']

    original = PersonalTimetable.objects.get(
        student=student, name=name, school=school, semester=semester)
    duplicate = PersonalTimetable.objects.create(
        student=student, name=new_name, school=school, semester=semester,
        has_conflict=original.has_conflict)
    for course in original.courses.all():
        duplicate.courses.add(course)
    for section in original.sections.all():
        duplicate.sections.add(section)

    timetables = get_student_tts(student, school, semester)
    saved_timetable = (x for x in timetables if x['id'] == duplicate.id).next()
    response = {'timetables': timetables,
                'saved_timetable': saved_timetable}
    return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
@login_required
def save_settings(request):
    student = Student.objects.get(user=request.user)
    params = json.loads(request.body)['userInfo']
    student.social_offerings = params['social_offerings']
    student.social_courses = params['social_courses']
    student.social_all = params['social_all']
    student.major = params['major']
    student.class_year = params['class_year']
    student.save()
    return HttpResponse("success")


@csrf_exempt
@login_required
def find_friends(request):
    school = request.subdomain
    student = Student.objects.get(user=request.user)
    if not student.social_all:
        return HttpResponse(json.dumps([]))
    semester, _ = Semester.objects.get_or_create(**json.loads(request.body)['semester'])
    current_tt = student.personaltimetable_set.filter(school=school, semester=semester).order_by('last_updated').last()
    if current_tt is None:
        return HttpResponse(json.dumps([]))
    current_tt_courses = current_tt.courses.all()

    # The most recent TT per student with social enabled that has courses in common with input student
    matching_tts = PersonalTimetable.objects.filter(student__social_all=True, courses__id__in=current_tt_courses) \
        .exclude(student=student) \
        .order_by('student', 'last_updated') \
        .distinct('student')

    friends = []
    for matching_tt in matching_tts:
        friend = matching_tt.student
        sections_in_common = matching_tt.sections.all() & current_tt.sections.all()
        courses_in_common = matching_tt.courses.all() & current_tt_courses

        shared_courses = []
        for course in courses_in_common:
            shared_courses.append({
                'course': model_to_dict(course, exclude=['unstopped_description', 'description', 'credits']),
                # is there a section for this course that is in both timetables?
                'in_section': (sections_in_common & course.section_set.all()).exists()
            })

        friends.append({
            'peer': model_to_dict(friend, exclude=['user','id','fbook_uid', 'friends']),
            'is_friend': student.friends.filter(id=friend.id).exists(),
            'shared_courses': shared_courses,
            'profile_url': 'https://www.facebook.com/' + friend.fbook_uid,
            'name': friend.user.first_name + ' ' + friend.user.last_name,
            'large_img': 'https://graph.facebook.com/' + friend.fbook_uid + '/picture?width=700&height=700'
        })

    friends.sort(key=lambda friend: len(friend['shared_courses']), reverse=True)
    return HttpResponse(json.dumps(friends))


@csrf_exempt
@login_required
def get_classmates(request):
    school = request.subdomain
    student = Student.objects.get(user=request.user)
    course_ids = json.loads(request.body)['course_ids']
    try:
        semester, _ = Semester.objects.get_or_create(**json.loads(request.body)['semester'])
    except:
        semester = None 
    # user opted in to sharing courses
    if student.social_courses:
        courses = []
        friends = student.friends.filter(social_courses=True)
        for course_id in course_ids:
            courses.append(get_classmates_from_course_id(school, student, course_id, semester, friends=friends))
        return HttpResponse(json.dumps(courses), content_type='application/json')
    else:
        return HttpResponse("Must have social_courses enabled")


def get_classmates_from_course_id(school, student, course_id, semester, friends=None):
    if not friends: 
        # All friends with social courses/sharing enabled
        friends = student.friends.filter(social_courses=True)
    course = {'course_id': course_id}
    curr_ptts = PersonalTimetable.objects.filter(student__in=friends, courses__id__exact=course_id)\
        .filter(Q(semester=semester)).order_by('student','last_updated').distinct('student')
    past_ptts = PersonalTimetable.objects.filter(student__in=friends, courses__id__exact=course_id)\
        .filter(~Q(semester=semester)).order_by('student','last_updated').distinct('student')

    course['classmates'] = get_classmates_from_tts(student, course_id, curr_ptts)
    course['past_classmates'] = get_classmates_from_tts(student, course_id, past_ptts)
    return course


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


@csrf_exempt
@login_required
def get_most_classmate_count(request):
    school = request.subdomain
    student = Student.objects.get(user=request.user)
    course_ids = json.loads(request.body)['course_ids']
    semester, _ = Semester.objects.get_or_create(**json.loads(request.body)['semester'])
    course = []
    total_count = 0
    count = 0
    most_friend_course_id = -1
    for course_id in course_ids:
        temp_count = get_friend_count_from_course_id(school, student, course_id, semester)
        if temp_count > count:
            count = temp_count
            most_friend_course_id = course_id
        total_count += temp_count
    course = {"id" : most_friend_course_id, "count" : count, "total_count" : total_count}
    return HttpResponse(json.dumps(course))

def get_friend_count_from_course_id(school, student, course_id, semester):
    return PersonalTimetable.objects.filter(student__in=student.friends.all(), courses__id__exact=course_id)\
        .filter(Q(semester=semester)).distinct('student').count()

@csrf_exempt
@validate_subdomain
def react_to_course(request):
  json_data = {}
  school = request.subdomain

  try:
    logged = request.user.is_authenticated()
    params = json.loads(request.body)
    cid = params['cid']
    title = params['title']
    if logged and Student.objects.filter(user=request.user).exists():
      s = Student.objects.get(user=request.user)
      c = Course.objects.get(id=cid)
      if c.reaction_set.filter(title=title, student=s).exists():
        r = c.reaction_set.get(title=title, student=s)
        c.reaction_set.remove(r)
      else:
        r = Reaction(student=s, title=title)
        r.save()
        c.reaction_set.add(r)
      c.save()
      json_data['reactions'] = c.get_reactions(student=s)

    else:
      json_data['error'] = 'Must be logged in to rate'

  except Exception as e:
    print e
    json_data['error'] = 'Unknowssn error'

  
  return HttpResponse(json.dumps(json_data), content_type="application/json")

def create_unsubscribe_link(student):
  id, token = make_token(student).split(":", 1)
  return reverse('student.views.unsubscribe', kwargs={'id': id, 'token': token,})

def make_token(student):
  return TimestampSigner().sign(student.id)

def unsubscribe(request, id, token):
  student = Student.objects.get(id = id)

  if student and check_student_token(student, token):
    # Link is valid
    student.emails_enabled = False
    student.save()

    return render(request, 'unsubscribe.html')

  # Link is invalid. Redirect to homepage.
  return HttpResponseRedirect("/")


def get_semester_name_from_tt(tt):
    try:
        return Semester.objects.get(id=tt['semester']).name
    except KeyError:
        semester = 'Fall'
        for course in tt['courses']:
            for slot in course['slots']:
                semester_id = slot['semester']
                return Semester.objects.get(id=semester_id).name
        return semester

@csrf_exempt
@validate_subdomain
def add_tt_to_gcal(request):
    student = Student.objects.get(user=request.user)
    tt = json.loads(request.body)['timetable']
    credentials = get_google_credentials(student)
    http = credentials.authorize(httplib2.Http(timeout=100000000))
    service = discovery.build('calendar', 'v3', http=http)
    school = request.subdomain

    tt_name = tt.get('name')
    if not tt_name or "Untitled Schedule" in tt_name or len(tt_name) == 0:
        tt_name = "Semester.ly Schedule"
    else:
        tt_name += " - Semester.ly"

    #create calendar
    calendar = {'summary': tt_name, 'timeZone': 'America/New_York'}
    created_calendar = service.calendars().insert(body=calendar).execute()

    semester_name = get_semester_name_from_tt(tt)
    if semester_name == 'Fall':
        #ignore year, year is set to current year
        sem_start = datetime(2017,8,30,17,0,0)
        sem_end = datetime(2017,12,20,17,0,0)
    else:
        #ignore year, year is set to current year
        sem_start = datetime(2017,1,30,17,0,0)
        sem_end = datetime(2017,5,5,17,0,0)

    #add events
    for course in tt['courses']:
        for slot in course['slots']:
            start = next_weekday(sem_start, slot['day'])
            start = start.replace(hour=int(slot['time_start'].split(':')[0]), minute=int(slot['time_start'].split(':')[1]))
            end = next_weekday(sem_start, slot['day'])
            end = end.replace(hour=int(slot['time_end'].split(':')[0]), minute=int(slot['time_end'].split(':')[1]))
            until = next_weekday(sem_end, slot['day'])

            description = course.get('description','')
            instructors = 'Taught by: ' + slot['instructors'] + '\n' if len(slot.get('instructors','')) > 0 else ''

            res = {
              'summary': course['name'] + " " + course['code'] + slot['meeting_section'],
              'location': slot['location'],
              'description': course['code'] + slot['meeting_section'] + '\n' + instructors + description + '\n\n' + 'Created by Semester.ly',
              'start': {
                'dateTime': start.strftime("%Y-%m-%dT%H:%M:%S"),
                'timeZone': 'America/New_York',
              },
              'end': {
                'dateTime': end.strftime("%Y-%m-%dT%H:%M:%S"),
                'timeZone': 'America/New_York',
              },
              'recurrence': [
                'RRULE:FREQ=WEEKLY;UNTIL=' + until.strftime("%Y%m%dT%H%M%SZ") + ';BYDAY=' + DAY_MAP[slot['day']]
              ],
            }
            event = service.events().insert(calendarId=created_calendar['id'], body=res).execute()

    analytic = CalendarExport.objects.create(
        student = student,
        school = school,
        is_google_calendar = True
    )
    analytic.save()

    return HttpResponse(json.dumps({}), content_type="application/json")

@csrf_exempt
@validate_subdomain
def log_ical_export(request):
    try:
        student = Student.objects.get(user=request.user)
    except:
        student = None
    school = request.subdomain
    analytic = CalendarExport.objects.create(
        student = student,
        school = school,
        is_google_calendar = False
    )
    analytic.save()
    return HttpResponse(json.dumps({}), content_type="application/json")


class UserView(APIView):

    def patch(self, request):
        student = Student.objects.get(user=request.user)
        params = json.loads(request.body)['userInfo']
        student.social_offerings = params['social_offerings']
        student.social_courses = params['social_courses']
        student.social_all = params['social_all']
        student.major = params['major']
        student.class_year = params['class_year']
        student.emails_enabled = params['emails_enabled']
        student.save()
        return HttpResponse("success")


class UserTimetableView(APIView):

    def get(self, request, sem_name, year):
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        student = Student.objects.get(user=request.user)
        response = get_student_tts(student, request.subdomain, sem)
        return HttpResponse(json.dumps(response), content_type='application/json')

    def post(self, request):
        if 'source' in request.data: # duplicate existing timetable
            school = request.subdomain
            params = json.loads(request.body)
            tt = params['timetable']
            name = tt['name']
            semester = Semester.objects.get(id=tt['semester'])
            student = Student.objects.get(user=request.user)
            new_name = params['name']

            original = PersonalTimetable.objects.get(
                student=student, name=name, school=school, semester=semester)
            duplicate = PersonalTimetable.objects.create(
                student=student, name=new_name, school=school, semester=semester,
                has_conflict=original.has_conflict)
            for course in original.courses.all():
                duplicate.courses.add(course)
            for section in original.sections.all():
                duplicate.sections.add(section)

            timetables = get_student_tts(student, school, semester)
            saved_timetable = (x for x in timetables if x['id'] == duplicate.id).next()
            response = {'timetables': timetables,
                        'saved_timetable': saved_timetable}
            return HttpResponse(json.dumps(response), content_type='application/json')
        else:
            school = request.subdomain
            params = json.loads(request.body)
            courses = params['timetable']['courses']
            has_conflict = params['timetable']['has_conflict']
            name = params['name']
            semester, _ = Semester.objects.get_or_create(**params['semester'])
            student = Student.objects.get(user=request.user)
            error = {'error': 'Timetable with name already exists'}
            # if params['id'] is not provided (or params['id'] == 0) then this is a request to create a new timetable,
            # since an ID has not been created for this timetable yet
            tempId = params['id'] if params['id'] else -1
            # don't allow people to save timetables with the same name
            # two cases:
            # 1. the user is creating a new timetable with the given name,
            # in which case tempId will be -1 from above
            # 2. the user is editing the name of an existing timetable, in which
            # case tempId is the ID of that timetable, as passed from the frontend.
            # we check if a timetable with a different id has that name
            if PersonalTimetable.objects.filter(~Q(id=tempId),
                                                student=student,
                                                name=params['name'],
                                                semester=semester,
                                                school=school).exists():
                return HttpResponse(json.dumps(error), content_type='application/json')

            if params['id']:
                personal_timetable = PersonalTimetable.objects.get(
                    student=student, id=params['id'], school=school)
                personal_timetable.name = name
            else:
                personal_timetable = PersonalTimetable.objects.create(
                    student=student, name=name, school=school, semester=semester)
            # delete currently existing courses and course offerings for this timetable
            personal_timetable.courses.clear()
            personal_timetable.sections.clear()
            personal_timetable.save()
            for course in courses:
                course_obj = Course.objects.get(id=course['id'])
                personal_timetable.courses.add(course_obj)
                enrolled_sections = course['enrolled_sections']
                for section in enrolled_sections:
                    personal_timetable.sections.add(
                        course_obj.section_set.get(meeting_section=section, semester=semester))
            personal_timetable.has_conflict = has_conflict
            personal_timetable.save()
            timetables = get_student_tts(student, school, semester)
            saved_timetable = (x for x in timetables if x['id'] == personal_timetable.id).next()
            response = {'timetables': timetables, 'saved_timetable': saved_timetable}

            return HttpResponse(json.dumps(response), content_type='application/json')

    def delete(self, request, sem_name, year, tt_name):
        school = request.subdomain
        params = json.loads(request.body)
        name = params['name']
        semester = Semester.objects.get(id=params['semester'])
        student = Student.objects.get(user=request.user)

        PersonalTimetable.objects.filter(
            student=student, name=name, school=school, semester=semester).delete()

        timetables = get_student_tts(student, school, semester)
        response = {'timetables': timetables}
        return HttpResponse(json.dumps(response), content_type='application/json')


class ClassmateView(APIView):

    def get(self, request, sem_name, year):
        if request.query_params.get('counts'):
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            course_ids = request.query_params.getlist('course_ids')
            semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
            total_count = 0
            count = 0
            most_friend_course_id = -1
            for course_id in course_ids:
                temp_count = get_friend_count_from_course_id(school, student, course_id, semester)
                if temp_count > count:
                    count = temp_count
                    most_friend_course_id = course_id
                total_count += temp_count
            course = {"id": most_friend_course_id, "count": count, "total_count": total_count}
            return HttpResponse(json.dumps(course))
        elif request.query_params.get('course_ids'):
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            course_ids = request.query_params.getlist('course_ids')
            semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
            # user opted in to sharing courses
            if student.social_courses:
                courses = []
                friends = student.friends.filter(social_courses=True)
                for course_id in course_ids:
                    courses.append(get_classmates_from_course_id(school, student, course_id, semester, friends=friends))
                return HttpResponse(json.dumps(courses), content_type='application/json')
            else:
                return HttpResponse("Must have social_courses enabled")
        else:
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            if not student.social_all:
                return HttpResponse(json.dumps([]))
            semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
            current_tt = student.personaltimetable_set.filter(school=school, semester=semester).order_by(
                'last_updated').last()
            if current_tt is None:
                return HttpResponse(json.dumps([]))
            current_tt_courses = current_tt.courses.all()

            # The most recent TT per student with social enabled that has courses in common with input student
            matching_tts = PersonalTimetable.objects.filter(student__social_all=True,
                                                            courses__id__in=current_tt_courses) \
                .exclude(student=student) \
                .order_by('student', 'last_updated') \
                .distinct('student')

            friends = []
            for matching_tt in matching_tts:
                friend = matching_tt.student
                sections_in_common = matching_tt.sections.all() & current_tt.sections.all()
                courses_in_common = matching_tt.courses.all() & current_tt_courses

                shared_courses = []
                for course in courses_in_common:
                    shared_courses.append({
                        'course': model_to_dict(course, exclude=['unstopped_description', 'description', 'credits']),
                        # is there a section for this course that is in both timetables?
                        'in_section': (sections_in_common & course.section_set.all()).exists()
                    })

                friends.append({
                    'peer': model_to_dict(friend, exclude=['user', 'id', 'fbook_uid', 'friends']),
                    'is_friend': student.friends.filter(id=friend.id).exists(),
                    'shared_courses': shared_courses,
                    'profile_url': 'https://www.facebook.com/' + friend.fbook_uid,
                    'name': friend.user.first_name + ' ' + friend.user.last_name,
                    'large_img': 'https://graph.facebook.com/' + friend.fbook_uid + '/picture?width=700&height=700'
                })

            friends.sort(key=lambda friend: len(friend['shared_courses']), reverse=True)
            return HttpResponse(json.dumps(friends))


class GCalView(APIView):

    def post(self, request):
        student = Student.objects.get(user=request.user)
        tt = json.loads(request.body)['timetable']
        credentials = get_google_credentials(student)
        http = credentials.authorize(httplib2.Http(timeout=100000000))
        service = discovery.build('calendar', 'v3', http=http)
        school = request.subdomain

        tt_name = tt.get('name')
        if not tt_name or "Untitled Schedule" in tt_name or len(tt_name) == 0:
            tt_name = "Semester.ly Schedule"
        else:
            tt_name += " - Semester.ly"

        # create calendar
        calendar = {'summary': tt_name, 'timeZone': 'America/New_York'}
        created_calendar = service.calendars().insert(body=calendar).execute()

        semester_name = get_semester_name_from_tt(tt)
        if semester_name == 'Fall':
            # ignore year, year is set to current year
            sem_start = datetime(2017, 8, 30, 17, 0, 0)
            sem_end = datetime(2017, 12, 20, 17, 0, 0)
        else:
            # ignore year, year is set to current year
            sem_start = datetime(2017, 1, 30, 17, 0, 0)
            sem_end = datetime(2017, 5, 5, 17, 0, 0)

        # add events
        for course in tt['courses']:
            for slot in course['slots']:
                start = next_weekday(sem_start, slot['day'])
                start = start.replace(hour=int(slot['time_start'].split(':')[0]),
                                      minute=int(slot['time_start'].split(':')[1]))
                end = next_weekday(sem_start, slot['day'])
                end = end.replace(hour=int(slot['time_end'].split(':')[0]), minute=int(slot['time_end'].split(':')[1]))
                until = next_weekday(sem_end, slot['day'])

                description = course.get('description', '')
                instructors = 'Taught by: ' + slot['instructors'] + '\n' if len(slot.get('instructors', '')) > 0 else ''

                res = {
                    'summary': course['name'] + " " + course['code'] + slot['meeting_section'],
                    'location': slot['location'],
                    'description': course['code'] + slot[
                        'meeting_section'] + '\n' + instructors + description + '\n\n' + 'Created by Semester.ly',
                    'start': {
                        'dateTime': start.strftime("%Y-%m-%dT%H:%M:%S"),
                        'timeZone': 'America/New_York',
                    },
                    'end': {
                        'dateTime': end.strftime("%Y-%m-%dT%H:%M:%S"),
                        'timeZone': 'America/New_York',
                    },
                    'recurrence': [
                        'RRULE:FREQ=WEEKLY;UNTIL=' + until.strftime("%Y%m%dT%H%M%SZ") + ';BYDAY=' + DAY_MAP[slot['day']]
                    ],
                }
                event = service.events().insert(calendarId=created_calendar['id'], body=res).execute()

        analytic = CalendarExport.objects.create(
            student=student,
            school=school,
            is_google_calendar=True
        )
        analytic.save()

        return HttpResponse(json.dumps({}), content_type="application/json")
