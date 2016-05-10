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
	if logged:
		school = request.subdomain
		student = Student.objects.get(user=request.user)
		
		tts = school_to_personal_timetables[school].objects.filter(student=student)
		tts_dict = [] #aka titty dick
		#for each personal timetable
		for tt in tts:
			courses = []
			course_ids = []
			tt_dict = model_to_dict(tt,exclude=['personaltimetable_ptr'])
			#for each co in the personal timetable
			for co in tt.course_offerings.all():
				c = co.course # get the co's course
				c_dict = model_to_dict(c)

				if c.id not in course_ids: #if not in courses, add to course dictionary with co
					courses.append(c_dict)
					course_ids.append(c.id)
					courses[-1]['slots'] = [model_to_dict(co, exclude=['basecourseoffering_ptr'])]
					courses[-1]['enrolled_sections'] = [co.meeting_section]
				else: # already in the dictionary, add the co to it
					index = course_ids.index(c.id)
					co_dict = model_to_dict(tt,exclude=['personaltimetable_ptr'])
					courses[index]['slots'].append(model_to_dict(co, exclude=['basecourseoffering_ptr']))
					if co.meeting_section not in courses[index]['enrolled_sections']:
						courses[index]['enrolled_sections'].append(co.meeting_section)

			tt_dict['courses'] = courses
			tts_dict.append(tt_dict)

		response = model_to_dict(student, exclude=['user','id','fbook_uid', 'friends'])
		response['timetables'] = tts_dict
		response['userFirstName'] = request.user.first_name
		response['userLastName'] = request.user.last_name
		response['isLoggedIn'] = logged
	else:
		response = {
			'isLoggedIn': logged
		}
	return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
@login_required
def save_timetable(request):
	school = request.subdomain
	params = json.loads(request.body)
	courses = params['timetable']['courses']
	name = params['name']
	SchoolCourseOffering = school_to_models[school][1]
	student = Student.objects.get(user=request.user)
	personal_timetable, created = school_to_personal_timetables[school].objects.get_or_create(
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
	return HttpResponse("success")


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
		has_overlap = False
		# print friend.personaltimetable_set.all()
		for tt in school_to_personal_timetables[school].objects.filter(student=friend):
			if tt.courses.filter(id=course_id).exists():
				has_overlap = True
				if student.social_offerings and friend.social_offerings:
					friend_cos = filter(lambda co: co.course.id == course_id, tt.course_offerings.all())
					sections_set = set()
					for co in friend_cos:
						sections_set.add(co.meeting_section)
					classmate['sections'] = list(sections_set)
		if has_ovelap:
			course['classmates'].append(classmate)
	return course
