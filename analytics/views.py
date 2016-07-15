from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.http import Http404
import datetime, json, urllib2
import heapq
from datetime import timedelta
from student.views import get_student
from analytics.models import *
from student.models import *
from dateutil import tz
from timetable.school_mappers import VALID_SCHOOLS
to_zone = tz.gettz('America/New_York')


def view_analytics_dashboard(request):
    student = get_student(request)
    if student and student.user.is_staff:

        total_timetables_by_school = {}
        timetables_per_hour = {}
        shared_timetables_per_hour = {}
        for school in VALID_SCHOOLS:
            total_timetables_by_school[school] = number_timetables(school=school)
            timetables_per_hour[school] = number_timetables_per_hour(school=school)
            shared_timetables_per_hour[school] = number_timetables_per_hour(Timetable=SharedTimetable, school=school)

        return render_to_response('analytics_dashboard.html', {
                "timetables_per_hour":json.dumps(timetables_per_hour),
                "signups_per_hour":number_timetables_per_hour(Timetable=Student),
                "shared_timetables_per_hour":json.dumps(shared_timetables_per_hour),
                "total_timetables_by_school":json.dumps(total_timetables_by_school),
                "total_timetables":number_timetables(),
                "total_shared_timetables":number_timetables(Timetable=SharedTimetable),
                "total_signups":Student.objects.count(),
                "total_timetables_fall":number_timetables(semester="F"),
                "total_timetables_spring":number_timetables(semester="S"),
                "number_of_reactions":json.dumps(number_of_reactions()),
                "jhu_most_popular_courses":[], # needs to be refactored; was causing timeout on server because too slow
                "uoft_most_popular_courses":[], # needs to be refactored; was causing timeout on server because too slow
                "umd_most_popular_courses":[] # needs to be refactored; was causing timeout on server because too slow
            },
            context_instance=RequestContext(request))
            # "jhu_most_popular_courses":most_popular_courses(5, 'jhu', 'S'),
            # "uoft_most_popular_courses":most_popular_courses(5, 'uoft', 'S'),
            # "umd_most_popular_courses":most_popular_courses(5, 'umd', 'S'),
            # "jhu_most_searched_courses":most_popular_courses(5, 'jhu', 'F', AnalyticsCourseSearch),
            # "uoft_most_searched_courses":most_popular_courses(5, 'uoft', 'F', AnalyticsCourseSearch),
            # "umd_most_searched_courses":most_popular_courses(5, 'umd', 'F', AnalyticsCourseSearch)
    else:
        raise Http404

def save_analytics_timetable(courses, semester, school, student=None):
    """Create an analytics time table entry."""
    analytics_timetable = AnalyticsTimetable.objects.create(semester=semester,
                                                          school=school,
                                                          time_created=datetime.datetime.now(),
                                                          student=student)
    analytics_timetable.courses.add(*courses)
    analytics_timetable.save()

def save_analytics_course_search(query, courses, semester, school, student=None, advanced=False):
    """Create an analytics course search entry."""
    course_search = AnalyticsCourseSearch.objects.create(query=query,
                                                          semester=semester,
                                                          school=school,
                                                          student=student,
                                                          is_advanced=advanced)
    course_search.courses.add(*courses)
    course_search.save()

def number_timetables(Timetable = AnalyticsTimetable, school = None, semester = None, student = None, time_start = None, time_end = None):
    """Gets the number of time tables by school, semester, student, and/or time. Can be used for analytics or shared time tables."""
    timetables = Timetable.objects.all()
    if time_start and time_end:
        timetables = (
            timetables.filter(
                time_created__range=(time_start, time_end)
            )
        )

    if school:
        timetables = timetables.filter(school = school)

    if semester:
        timetables = timetables.filter(semester = semester)

    if student:
        timetables = timetables.filter(student = student)

    return timetables.count()

def number_timetables_per_hour(Timetable = AnalyticsTimetable, school = None):
    """Gets the number of time tables created each hour. Can be used for analytics or shared time tables."""
    # TODO: Change start and end time. Currently set for past 24 hours.
    time_end = datetime.datetime.now()
    length = timedelta(days = 1)
    time_start = time_end - length

    time_delta = timedelta(hours = 1)
    num_timetables = []
    while time_start < time_end:
        num_timetables.append(number_timetables(Timetable = Timetable, school = school, time_start = time_start, time_end = time_start + time_delta))
        time_start += time_delta
    return num_timetables

def number_of_reactions(max_only=False):
    """Gets the the number of uses for each reaction. If max_only is true, return only the reaction with the most uses."""
    # TODO: Could be modified for max AND number of each reaction.
    num_reactions = {}
    reaction_list = Reaction.REACTION_CHOICES
    for title, text in reaction_list:
        reaction = None
        reactions = Reaction.objects.filter(title = title)
        num_reactions[title] = len(reactions)
    if max_only:
        return max(num_reactions.iterkeys(), key=lambda k: num_reactions[k])
    else:
        return num_reactions

def most_popular_courses(n, school, semester, Table = AnalyticsTimetable):
    """Gets the top n most popular courses searched (AnalyticsCourseSearch) or in time table(AnalyticsTimetable)."""
    num_courses = {}
    link_to_courses = Table.objects.filter(school = school, semester = semester)
    for link_to_course in link_to_courses:
        for course in link_to_course.courses.all():
            if course.id in num_courses:
                num_courses[course.id] += 1
            else:
                num_courses[course.id] = 1
    course_ids = heapq.nlargest(n, num_courses, key=lambda k: num_courses[k])
    return Course.objects.filter(pk__in = course_ids)