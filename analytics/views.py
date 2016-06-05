from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q

import datetime, json, urllib2
import heapq
from datetime import timedelta

from analytics.models import *
from student.models import *
from dateutil import tz
to_zone = tz.gettz('America/New_York')


def view_analytics_dashboard(request):
    return render_to_response('analytics_dashboard.html', {},
        context_instance=RequestContext(request))

def save_analytics_timetable(courses, semester, school, student=None):
    """Create an analytics time table entry."""
    analytics_timetable = AnalyticsTimetable.objects.create(semester=semester,
                                                          school=school,
                                                          time_created=datetime.datetime.now(),
                                                          student=student)
    analytics_timetable.courses.add(*courses)
    analytics_timetable.save()

def save_analytics_course_search(query, semester, school, student=None, advanced=False):
    """Create an analytics course search entry."""
    course_search = AnalyticsCourseSearch.objects.create(query=query,
                                                          semester=semester,
                                                          school=school,
                                                          student=student,
                                                          is_advanced=advanced)
    course_search.save()

def number_timetables(timetable = AnalyticsTimetable, school = None, semester = None, student = None, time_start = None, time_end = None):
    """Gets the number of time tables by school, semester, student, and/or time. Can be used for analytics or shared time tables."""
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
    """Gets the number of time tables created each hour."""
    # TODO: Change start and end time.
    time_start = datetime.datetime(2016, 5, 30, 0, 0, 0)
    time_end = datetime.datetime(2016, 5, 31, 12, 0, 0)
    time_delta = timedelta(hours = 1)
    num_timetables = []
    while time_start <= time_end:
        num_timetables.append(number_timetables(timetable = timetable, time_start = time_start, time_end = time_start + time_delta))
        time_start += time_delta
    return num_timetables

def most_popular_reaction():
    """Gets the the most popular reaction."""
    # TODO: Could be modified for max AND number of each reaction.
    num_reactions = {}
    reaction_list = Reaction.REACTION_CHOICES
    for title, text in reaction_list:
        reaction = None
        reactions = Reaction.objects.filter(title = title)
        if len(reactions) > 0:
            reaction = reactions[0]
            num_reactions[title] = len(reaction.course.all())
        else:
            num_reactions[title] = 0
    return max(num_reactions.iterkeys(), key=lambda k: num_reactions[k])

def most_popular_courses(n, school, semester, table = AnalyticsTimetable):
    """Gets the top n most popular courses searched (AnalyticsCourseSearch) or in time table(AnalyticsTimetable)."""
    num_courses = {}
    link_to_courses = table.objects.filter(school = school, semester = semester)
    for link_to_course in link_to_courses:
        for course in link_to_course.courses.all():
            if course.id in num_courses:
                num_courses[course.id] += 1
            else:
                num_courses[course.id] = 1

    return heapq.nlargest(n, num_courses, key=lambda k: num_courses[k])
    