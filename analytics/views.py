import json
import urllib2
import heapq
from dateutil import tz
from datetime import timedelta, datetime
from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.http import Http404

from student.views import get_student
from student.models import *
from analytics.models import *
from timetable.models import Semester
from timetable.school_mappers import VALID_SCHOOLS


to_zone = tz.gettz('America/New_York')

def view_analytics_dashboard(request):
    student = get_student(request)
    if student and student.user.is_staff:
        # Number of time tables by school
        total_timetables_by_school = {}
        # timetables_per_hour = {}
        # shared_timetables_per_hour = {}
        for school in VALID_SCHOOLS:
            total_timetables_by_school[school] = number_timetables(school=school)
            # timetables_per_hour[school] = number_timetables_per_hour(school=school)
            # shared_timetables_per_hour[school] = number_timetables_per_hour(Timetable=SharedTimetable, school=school)

        # Number of users by permission
        # TODO: Moves this array to somewhere else (like VALID_SCHOOLS)
        total_signups = number_timetables(Timetable=Student)

        permissions = ["social_courses", "social_offerings", "social_all"]
        num_users_by_permission = {}
        for permission in permissions:
            # TODO: hacky way of passing in permission as an identifier for parameter. 
            # Also have to use tuple for template to easily access %.
            args = {"Timetable": Student, permission: True}
            num_users = number_timetables(**args)
            percent_users = format(float(num_users) / total_signups * 100, '.2f')
            num_users_by_permission[permission] = (num_users, percent_users)

        total_calendar_exports = number_timetables(Timetable=CalendarExport)
        google_calendar_exports = number_timetables(Timetable=CalendarExport, is_google_calendar=True)
        ics_calendar_exports = total_calendar_exports - google_calendar_exports
        unique_users_calendar_exports = number_timetables(Timetable=CalendarExport, distinct="student")

        total_final_exam_views = number_timetables(Timetable=FinalExamModalView)
        unique_users_final_exam_views = number_timetables(Timetable=FinalExamModalView, distinct="student")

        return render_to_response('analytics_dashboard.html', {
                "signups_per_hour": number_timetables_per_hour(
                    Timetable=Student,start_delta_days=7, interval_delta_hours=24),
                "total_timetables_by_school": json.dumps(total_timetables_by_school),
                "total_timetables_by_semester": json.dumps(number_timetables_per_semester()),
                "total_timetables": number_timetables(),
                "total_shared_timetables": number_timetables(Timetable=SharedTimetable),
                "total_personal_timetables": number_timetables(Timetable=PersonalTimetable),
                "total_signups": total_signups,
                "num_users_chrome_notifs": number_user_chrome_notifs(),
                "num_users_by_permission": num_users_by_permission,
                "num_users_by_class_year": json.dumps(number_students_by_year()),
                "num_users_by_school": json.dumps(number_students_by_school()),
                "number_of_reactions": json.dumps(number_of_reactions()),
                "total_calendar_exports": total_calendar_exports,
                "google_calendar_exports": google_calendar_exports,
                "ics_calendar_exports": ics_calendar_exports,
                "unique_users_calendar_exports": unique_users_calendar_exports,
                "total_final_exam_views": total_final_exam_views,
                "unique_users_final_exam_views": unique_users_final_exam_views,
                "calendar_exports_by_type": json.dumps({"ics": ics_calendar_exports, "google": google_calendar_exports}),
                "jhu_most_popular_courses": [], # needs to be refactored; was causing timeout on server because too slow
                "uoft_most_popular_courses": [], # needs to be refactored; was causing timeout on server because too slow
                "umd_most_popular_courses": [] # needs to be refactored; was causing timeout on server because too slow
            },
            context_instance=RequestContext(request))
    else:
        raise Http404

def save_analytics_timetable(courses, semester, school, student=None):
    """Create an analytics time table entry."""
    analytics_timetable = AnalyticsTimetable.objects.create(
        semester=semester,
        school=school,
        time_created=datetime.now(),
        student=student)
    analytics_timetable.courses.add(*courses)
    analytics_timetable.save()

def save_analytics_course_search(query, courses, semester, school, student=None, advanced=False):
    """Create an analytics course search entry."""
    course_search = AnalyticsCourseSearch.objects.create(
        query=query,
        semester=semester,
        school=school,
        student=student,
        is_advanced=advanced)
    course_search.courses.add(*courses)
    course_search.save()

def number_timetables(**parameters):
    """
    Get the number of timetables filtered by any parameters. 
    Use Timetable to specify the table to filter.
    """
    Timetable = parameters.pop("Timetable") if "Timetable" in parameters else AnalyticsTimetable

    timetables = Timetable.objects.all()
    if "time_start" in parameters and "time_end" in parameters:
        timetables = (
            timetables.filter(
                time_created__range=(parameters.pop("time_start"), parameters.pop("time_end"))
            )
        )
    if "distinct" in parameters:
        timetables = timetables.distinct(parameters.pop("distinct"))
    timetables = timetables.filter(
        **{param: val for (param, val) in parameters.iteritems() if val is not None})
    return timetables.count()

def number_timetables_per_hour(Timetable=AnalyticsTimetable, school=None, 
                                start_delta_days=1, interval_delta_hours=1):
    """
    Get the number of time tables created each hour. 
    Can be used for analytics or shared time tables.
    """
    # TODO: Change start and end time. Currently set for past 24 hours.
    time_end = datetime.now()
    length = timedelta(days = start_delta_days)
    time_start = time_end - length

    time_delta = timedelta(hours=interval_delta_hours)
    num_timetables = []
    while time_start < time_end:
        num_timetables.append(number_timetables(
            Timetable=Timetable,
            school=school,
            time_start=time_start,
            time_end=time_start + time_delta)
        )
        time_start += time_delta
    return num_timetables

def number_timetables_per_semester():
    num_timetables = {}
    for semester in Semester.objects.distinct():
        num_timetables[str(semester)] = number_timetables(semester=semester)
    return num_timetables

def number_of_reactions(max_only=False):
    """
    Get the the number of uses for each reaction. 
    If max_only is true, return only the reaction with the most uses.
    """
    # TODO: Could be modified for max AND number of each reaction.
    num_reactions = {}
    reaction_list = Reaction.REACTION_CHOICES
    for title, text in reaction_list:
        reaction = None
        reactions = Reaction.objects.filter(title=title)
        num_reactions[title] = len(reactions)
    if max_only:
        return max(num_reactions.iterkeys(), key=num_reactions.get)
    else:
        return num_reactions

def most_popular_courses(n, school, semester, Table=AnalyticsTimetable):
    """
    Get the top n most popular courses searched (AnalyticsCourseSearch) or in 
    timetable (AnalyticsTimetable).
    """
    num_courses = {}
    link_to_courses = Table.objects.filter(school=school, semester=semester)
    for link_to_course in link_to_courses:
        for course in link_to_course.courses.all():
            if course.id in num_courses:
                num_courses[course.id] += 1
            else:
                num_courses[course.id] = 1
    course_ids = heapq.nlargest(n, num_courses, num_courses.get)
    return Course.objects.filter(pk__in = course_ids)

def number_students_by_year():
    """Get the number of students by class year."""
    valid_class_years = Student.objects.values("class_year").distinct()
    count_class_years = {}
    for class_year in valid_class_years:
        count_class_years[class_year["class_year"]] = \
            Student.objects.filter(class_year=class_year["class_year"]).count()
    return count_class_years

def number_students_by_school():
    result = {}
    for school in VALID_SCHOOLS:
        ids = PersonalTimetable.objects.filter(school=school)\
                                        .values_list("student", flat=True)\
                                        .distinct() 
        students = Student.objects.filter(id__in=ids) | Student.objects.filter(school=school)
        result[school] = students.count()
    return result

def number_user_chrome_notifs():
    return RegistrationToken.objects.values_list("student", flat=True).distinct().count()