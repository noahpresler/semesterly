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

def get_user(request):
	logged = request.user.is_authenticated()
	if logged:
		student = Student.objects.get(user=request.user)
		firstName = request.user.first_name
		lastName = request.user.last_name
		usrImg = student.img_url
		response = {
			'userFirstName': firstName,
			'userLastName': lastName,
			'isLoggedIn': logged,
			'userImg': usrImg
		}
	else:
		response = {
			'isLoggedIn': logged
		}
	return HttpResponse(json.dumps(response), content_type='application/json')