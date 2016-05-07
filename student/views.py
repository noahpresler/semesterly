from django.shortcuts import render
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

# Create your views here.
@csrf_exempt
def get_user(request):
	response = {
		'userFirstName': "Rohan",
		'isLoggedIn': True,
		'userImg': 'https://scontent-iad3-1.xx.fbcdn.net/v/t1.0-9/11264970_1439031266401179_48567503498271249_n.jpg?oh=d3da18464d8ea16e280934b1faafb206&oe=57AA84F0'
	}
	return HttpResponse(json.dumps(response), content_type='application/json')