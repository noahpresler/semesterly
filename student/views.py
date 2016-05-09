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
		school = request.subdomain
		
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
					courses[-1]['course_offerings'] = [model_to_dict(co, exclude=['basecourseoffering_ptr'])]
				else: # already in the dictionary, add the co to it
					co_dict = model_to_dict(tt,exclude=['personaltimetable_ptr'])
					courses[course_ids.index(c.id)]['course_offerings'].append(model_to_dict(co, exclude=['basecourseoffering_ptr']))
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
	# delete currently existing offerings for this timetable
	personal_timetable.course_offerings.clear()
	personal_timetable.save()
	for course in courses:
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

# @csrf_exempt
# @login_required
# def get_classmates(request):
# 	school = request.subdomain
# 	student = Student.objects.get(user=request.user)
# 	params = json.loads(request.body)
# 	course = Course.get(id=params['course_id'])
# 	friends = student.friends.all()
# 	classmates = []
# 	SchoolCourseOffering = school_to_models[school][1]
# 	for friend in friends:
# 		for tt in school_to_personal_timetables[school].filter(student=friend):
# 			if 
# 	return HttpResponse("success")
