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

def save_analytics_timetable(courses, semester, school, student=None):
    analytics_timetable = AnalyticsTimetable.objects.create(semester=semester,
                                                          school=school,
                                                          time_created=datetime.datetime.now(),
                                                          student=student)
    analytics_timetable.courses.add(*courses)
    analytics_timetable.save()

def number_analytics_timetables(school=None, semester=None, student=None):
    timetables = AnalyticsTimetable.objects.filter(student=student, school='jhu')
    return len(timetables)