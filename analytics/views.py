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

def number_timetables(timetable = AnalyticsTimetable, school = None, semester = None, student = None, time_start = None, time_end = None):
    timetables = []
    if time_start and time_end:
        timetables += (
            timetable.objects.filter(
                time_created__range=(time_start, time_end)
            )
        )

    if school:
        timetables += timetable.objects.filter(school = school)

    if semester:
        timetables += timetable.objects.filter(semester = semester)

    if student:
        timetables += timetable.objects.filter(student = student)

    return len(timetables)

def number_timetables_per_hour(timetable = AnalyticsTimetable):
    # TODO: Change start and end time.
    time_start = datetime.datetime(2016, 5, 30, 0, 0, 0)
    time_end = datetime.datetime(2016, 5, 31, 12, 0, 0)
    time_delta = timedelta(hours = 1)
    num_timetables = []
    while time_start <= time_end:
        num_timetables.append(number_timetables(timetable = timetable, time_start = time_start, time_end = time_start + time_delta))
        time_start += time_delta
    return num_timetables