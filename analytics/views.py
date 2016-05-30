from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt

from django.db.models import Q

import datetime, json, urllib2
from datetime import timedelta

from analytics.models import *
from dateutil import tz

to_zone = tz.gettz('America/New_York')


def view_analytics_dashboard(request):
	return render_to_response('analytics_dashboard.html', {}, 
		context_instance=RequestContext(request))
