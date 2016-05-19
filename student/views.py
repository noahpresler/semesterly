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
from timetable.school_mappers import school_to_models, school_to_personal_timetables

def get_user(request):
	logged = request.user.is_authenticated()
	if logged and Student.objects.filter(user=request.user).exists():
		school = request.subdomain
		student = Student.objects.get(user=request.user)
		response = model_to_dict(student, exclude=['user','id','fbook_uid', 'friends'])
		response['timetables'] = get_student_tts(student,school)
		response['userFirstName'] = request.user.first_name
		response['userLastName'] = request.user.last_name
		response['isLoggedIn'] = logged
	else:
		response = {
			'isLoggedIn': False
		}
	return HttpResponse(json.dumps(response), content_type='application/json')

def get_student_tts(student,school):
		tts = school_to_personal_timetables[school].objects.filter(student=student).order_by('-last_updated')
		tts_dict = [] #aka titty dick
		#for each personal timetable
		for tt in tts:
			courses = []
			course_ids = []
			tt_dict = model_to_dict(tt,exclude=['personaltimetable_ptr'])
			tt_dict['last_updated'] = str(tt.last_updated)
			#for each co in the personal timetable
			for co in tt.course_offerings.all():
				c = co.course # get the co's course

				if c.id not in course_ids: #if not in courses, add to course dictionary with co
					c_dict = model_to_dict(c)
					courses.append(c_dict)
					course_ids.append(c.id)
					courses[-1]['slots'] = [model_to_dict(co, exclude=['basecourseoffering_ptr'])]
					courses[-1]['enrolled_sections'] = [co.meeting_section]
					courses[-1]['textbooks'] = co.get_textbooks()
				else: # already in the dictionary, add the co to it
					index = course_ids.index(c.id)
					co_dict = model_to_dict(tt,exclude=['personaltimetable_ptr'])
					courses[index]['slots'].append(model_to_dict(co, exclude=['basecourseoffering_ptr']))
					courses[index]['textbooks'].extend(co.get_textbooks())
					if co.meeting_section not in courses[index]['enrolled_sections']:
						courses[index]['enrolled_sections'].append(co.meeting_section)

			tt_dict['courses'] = courses
			tts_dict.append(tt_dict)
		return tts_dict

@csrf_exempt
@login_required
def save_timetable(request):
	school = request.subdomain
	params = json.loads(request.body)
	courses = params['timetable']['courses']
	name = params['name']
	SchoolCourseOffering = school_to_models[school][1]
	PT = school_to_personal_timetables[school]
	student = Student.objects.get(user=request.user)
	error = {'error': 'Timetable with name already exists'}
	# if not params['id'] (or params['id'] == 0) then this is a request to create a new timetable,
	# since an ID has not been created for this timetable yet
	tempId = params['id'] if params['id'] else -1
	# don't allow people to save timetables with the same name
	# two cases:
	# 1. the user is creating a new timetable with the given name,
	# in which case tempId will be 0 from above
	# 2. the user is editing the name of an existing timetbale, in which
	# case tempId is the ID of that timetable, as passed from the frontend.
	# we check if a timetable with a different id has that name
	if PT.objects.filter(~Q(id=tempId), student=student, name=params['name']).exists():
		return HttpResponse(json.dumps(error), content_type='application/json')

	if params['id']:
		personal_timetable = PT.objects.get(
			student=student, id=params['id'], school=school)
		personal_timetable.name = name
	else:
		personal_timetable = PT.objects.create(
			student=student, name=name, school=school)
	# delete currently existing courses and course offerings for this timetable
	personal_timetable.courses.clear()
	personal_timetable.course_offerings.clear()
	personal_timetable.save()
	for course in courses:
		personal_timetable.courses.add(Course.objects.get(id=course['id']))
		for course_offering in course['slots']:
			personal_timetable.course_offerings.add(SchoolCourseOffering.objects.get(id=course_offering['id']))
	personal_timetable.save()
	timetables = get_student_tts(student,school)
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
		ptts = school_to_personal_timetables[school].objects.filter(student=friend,courses__id__exact=course_id)
		for tt in ptts:
			if student.social_offerings and friend.social_offerings:
				friend_cos = tt.course_offerings.all().filter(course__id__exact=course_id)
				sections = friend_cos.values('meeting_section').distinct()
				classmate['sections'] = list(map(lambda d: d['meeting_section'], sections))
		if len(ptts) > 0:
			course['classmates'].append(classmate)
	return course
