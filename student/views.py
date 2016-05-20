from collections import OrderedDict
from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.db.models import Q
from hashids import Hashids
from pytz import timezone
import copy, functools, itertools, json, logging, os
from analytics.views import *
from timetable.models import *
from student.models import *
from django.forms.models import model_to_dict
from django.contrib.auth.decorators import login_required

from timetable.views import validate_subdomain, merge_dicts

def get_user(request):
	logged = request.user.is_authenticated()
	if logged and Student.objects.filter(user=request.user).exists():
		school = request.subdomain
		student = Student.objects.get(user=request.user)
		response = model_to_dict(student, exclude=['user','id','fbook_uid', 'friends'])
		response['timetables'] = get_student_tts(student, school, "F")
		response['userFirstName'] = request.user.first_name
		response['userLastName'] = request.user.last_name
		response['isLoggedIn'] = logged
	else:
		response = {
			'isLoggedIn': False
		}
	return HttpResponse(json.dumps(response), content_type='application/json')

@login_required
@validate_subdomain
@csrf_exempt
def get_student_tts_wrapper(request, school, sem):
	student = Student.objects.get(user=request.user)
	response = get_student_tts(student, school, sem)
	return HttpResponse(json.dumps(response), content_type='application/json')

def get_student_tts(student, school, semester):
	tts = student.personaltimetable_set.filter(school=school, semester=semester).order_by('-last_updated')
	tts_dict = [] #aka titty dick
	#for each personal timetable
	for tt in tts:
		courses = []
		course_ids = []
		tt_dict = model_to_dict(tt)
		tt_dict['last_updated'] = str(tt.last_updated)
		#for each co in the personal timetable

		for section_obj in tt.sections.all():
			c = section_obj.course # get the section's course
			c_dict = model_to_dict(c)

			if c.id not in course_ids: #if not in courses, add to course dictionary with co
				c_dict = model_to_dict(c)
				courses.append(c_dict)
				course_ids.append(c.id)
				courses[-1]['slots'] = []
				courses[-1]['enrolled_sections'] = []
				courses[-1]['textbooks'] = []

			index = course_ids.index(c.id)
			courses[index]['slots'].extend([merge_dicts(model_to_dict(section_obj), model_to_dict(co)) for co in section_obj.offering_set.all()])
			courses[index]['enrolled_sections'].append(section_obj.meeting_section)

		tt_dict['courses'] = courses
		tts_dict.append(tt_dict)
	return tts_dict

@csrf_exempt
@login_required
@validate_subdomain
def save_timetable(request):
	school = request.subdomain
	params = json.loads(request.body)
	courses = params['timetable']['courses']
	name = params['name']
	semester = params['semester']
	student = Student.objects.get(user=request.user)
	error = {'error': 'Timetable with name already exists'}
	# if not params['id'] (or params['id'] == 0) then this is a request to create a new timetable,
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
	personal_timetable.save()
	timetables = get_student_tts(student, school, semester)
	saved_timetable = (x for x in timetables if x['id'] == personal_timetable.id).next()
	response = {'timetables': timetables, 'saved_timetable': saved_timetable}

	return HttpResponse(json.dumps(response), content_type='application/json')


@csrf_exempt
@login_required
def save_settings(request):
	student = Student.objects.get(user=request.user)
	params = json.loads(request.body)['userInfo']
	student.social_offerings = params['social_offerings']
	student.social_courses = params['social_courses']
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

def get_classmates_from_course_id(school, student, course_id):
	#All friends with social courses/sharing enabled
	friends = student.friends.filter(social_courses=True)
	course = { 'course_id': course_id, 'classmates': [] }
	for friend in friends:
		classmate = model_to_dict(friend, exclude=['user','id','fbook_uid', 'friends'])
		ptts = PersonalTimetable.objects.filter(student=friend,courses__id__exact=course_id)
		for tt in ptts:
			if student.social_offerings and friend.social_offerings:
				friend_cos = tt.course_offerings.all().filter(course__id__exact=course_id)
				sections = friend_cos.values('meeting_section').distinct()
				classmate['sections'] = list(map(lambda d: d['meeting_section'], sections))
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
