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
		student = Student.objects.get(user=request.user)
		response = model_to_dict(student, exclude=['user','id','fbook_uid', 'friends'])
		response['userFirstName'] = request.user.first_name
		response['userLastName'] = request.user.last_name
		response['isLoggedIn'] = logged
	else:
		response = {
			'isLoggedIn': logged
		}
	return HttpResponse(json.dumps(response), content_type='application/json')

@csrf_exempt
def save_timetable(request):
	school = request.subdomain
	params = json.loads(request.body)
	courses = params['timetable']['courses']
	name = params['name']
	SchoolCourseOffering = school_to_models[school][1]
	student = Student.objects.get(user=request.user)
	personal_timetable, created = school_to_personal_timetables[school].objects.get_or_create(
		student=student, name=name)
	# delete currently existing offerings for this timetable
	personal_timetable.course_offerings.clear()
	personal_timetable.save()
	for course in courses:
		for course_offering in course['slots']:
			personal_timetable.course_offerings.add(SchoolCourseOffering.objects.get(id=course_offering['id']))
	personal_timetable.save()
	return HttpResponse("success")
