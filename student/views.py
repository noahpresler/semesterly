from collections import OrderedDict
from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.db.models import Q
from django.core.urlresolvers import reverse
from hashids import Hashids
from pytz import timezone
import copy, functools, itertools, json, logging, os
from timetable.models import *
from student.models import *
from django.forms.models import model_to_dict
from django.contrib.auth.decorators import login_required
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired


from timetable.utils import *

def get_student(request):
  logged = request.user.is_authenticated()
  if logged and Student.objects.filter(user=request.user).exists():
    return Student.objects.get(user=request.user)
  else:
    return None

def get_avg_rating(course_ids):
  avgs = [Course.objects.get(id=cid).get_avg_rating() \
          for cid in set([cid for cid in course_ids])]
  return min(5, sum(avgs)/len(avgs) if avgs else 0)

def get_user_dict(school, student, semester):
    user_dict = {}
    if student:
        user_dict = model_to_dict(student, exclude=["user","id","friends"])
        user_dict["timetables"] = get_student_tts(student, school, semester)
        user_dict["userFirstName"] = student.user.first_name
        user_dict["userLastName"] = student.user.last_name
    
    user_dict["isLoggedIn"] = student is not None

    return user_dict

@login_required
@validate_subdomain
@csrf_exempt
def get_student_tts_wrapper(request, school, sem):
    student = Student.objects.get(user=request.user)
    response = get_student_tts(student, school, sem)
    return HttpResponse(json.dumps(response), content_type='application/json')

def get_student_tts(student, school, semester):
    tts = student.personaltimetable_set.filter(school=school, semester=semester).order_by('-last_updated')
    # create a list containing all PersonalTimetables for this semester in their dictionary representation
    tts_list = [convert_tt_to_dict(tt) for tt in tts] # aka titty dick
    return tts_list


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
        courses[index]['slots'].extend([merge_dicts(model_to_dict(section_obj), model_to_dict(co)) for co in section_obj.offering_set.all()])
        courses[index]['textbooks'][section_obj.meeting_section] = section_obj.get_textbooks()

        courses[index]['enrolled_sections'].append(section_obj.meeting_section)

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
    semester = params['semester']
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
    if PersonalTimetable.objects.filter(~Q(id=tempId), student=student, name=params['name'], semester=semester, school=school).exists():
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
            personal_timetable.sections.add(course_obj.section_set.get(meeting_section=section,
                                                                    semester__in=[semester, "Y"]))
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
    semester = params['semester']
    student = Student.objects.get(user=request.user)

    PersonalTimetable.objects.filter(
        student=student, name=name, school=school, semester=semester).delete()

    timetables = get_student_tts(student, school, semester)
    response = {
        'timetables': timetables
        'saved_timetable': timetables[0] if timetables else False}
    return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
@login_required
@validate_subdomain
def duplicate_timetable(request):
    school = request.subdomain
    tt = json.loads(request.body)
    name = tt['name']
    semester = tt['semester']
    student = Student.objects.get(user=request.user)
    new_name = name + ' (copy)'

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
def get_classmates(request):
    school = request.subdomain
    student = Student.objects.get(user=request.user)
    course_ids = json.loads(request.body)['course_ids']
    # user opted in to sharing courses
    if student.social_courses:
        courses = []
        for course_id in course_ids:
            courses.append(get_classmates_from_course_id(school, student, course_id))
        return HttpResponse(json.dumps(courses), content_type='application/json')
    else:
        return HttpResponse("Must have social_courses enabled")

@csrf_exempt
@login_required
def find_friends(request):
    school = request.subdomain
    student = Student.objects.get(user=request.user)
    if not student.social_all:
        return HttpResponse("Must have social_all enabled")
    student_tt = student.personaltimetable_set.filter(school=school).order_by('last_updated').last()
    c = student_tt.courses.all()
    friends = []
    
    students = Student.objects.filter(social_all=True,personaltimetable__courses__id__in=c).exclude(id=student.id).distinct()
    peers = filter(lambda s: s.personaltimetable_set.filter(school=school).order_by('last_updated').last().courses.all() & c, students)
    for peer in peers:
        peer_tt = peer.personaltimetable_set.filter(school=school).order_by('last_updated').last()
        shared_courses = map(
                lambda x: {
                    'course': model_to_dict(x,exclude=['unstopped_description','description','credits']),
                    'in_section': peer_tt.sections.filter(id=student_tt.sections.get(course__id=x.id).id).exists()
                },
                c & peer_tt.courses.all(),
            )
        friends.append({
            'peer': model_to_dict(peer,exclude=['user','id','fbook_uid', 'friends']),
            'is_friend': student.friends.filter(id=peer.id).exists(),
            'shared_courses': shared_courses,
            'profile_url': 'https://www.facebook.com/' + peer.fbook_uid,
            'name': peer.user.first_name + ' ' + peer.user.last_name,
            'large_img': 'https://graph.facebook.com/' + peer.fbook_uid + '/picture?type=normal'
        })
    friends.sort(key=lambda l: len(l['shared_courses']), reverse=True)
    return HttpResponse(json.dumps(friends))

def get_classmates_from_course_id(school, student, course_id):
    # All friends with social courses/sharing enabled
    friends = student.friends.filter(social_courses=True)
    course = { 'course_id': course_id, 'classmates': [] }
    for friend in friends:
        classmate = model_to_dict(friend, exclude=['user','id','fbook_uid', 'friends'])
        classmate['first_name'] = friend.user.first_name
        classmate['last_name'] = friend.user.last_name
        ptts = PersonalTimetable.objects.filter(student=friend, courses__id__exact=course_id)
        for tt in ptts:
            if student.social_offerings and friend.social_offerings:
                friend_sections = tt.sections.all().filter(course__id=course_id)
                sections = list(friend_sections.values_list('meeting_section', flat=True).distinct())
                classmate['sections'] = sections
        if len(ptts) > 0:
            course['classmates'].append(classmate)
    return course

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

def check_token(student, token):
  try:
    key = '%s:%s' % (student.id, token)
    TimestampSigner().unsign(key, max_age=60 * 60 * 48) # Valid for 2 days
  except (BadSignature, SignatureExpired):
    return False
  return True

def unsubscribe(request, id, token):
  student = Student.objects.get(id = id)

  if student and check_token(student, token):
    # Link is valid
    student.emails_enabled = False
    student.save()

    return render(request, 'unsubscribe.html')

  # Link is invalid. Redirect to homepage.
  return HttpResponseRedirect("/")
