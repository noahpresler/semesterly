# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import datetime

from django.db.models import Q
from django.forms import model_to_dict

from student.models import Student, PersonalTimetable
from timetable.models import Course
from timetable.serializers import DisplayTimetableSerializer


DAY_LIST = ['M', 'T', 'W', 'R', 'F', 'S', 'U']


def next_weekday(d, weekday):
    """
    Given a current date, d, and a target weekday, calculate
    the next occurence (moving in the future) of that weekday.

    Returns:
        (:obj:`datetime.datetime`): the next weekday of the given type
    """
    d = d - datetime.timedelta(days=1)
    days_ahead = DAY_LIST.index(weekday) - d.weekday()
    if days_ahead <= 0:  # Target day already happened this week
        days_ahead += 7
    return d + datetime.timedelta(days_ahead)


def get_student(request):
    """
    Returns:
        (:obj:`Student`): the student belonging to the authenticated user
    """
    logged = request.user.is_authenticated
    if logged and Student.objects.filter(user=request.user).exists():
        return Student.objects.get(user=request.user)
    else:
        return None


def get_classmates_from_course_id(
        school, student, course_id, semester, friends=None, include_same_as=False):
    """
    Get's current and past classmates (students with timetables containing
    the provided course ID). Classmates must have social_courses enabled
    to be included. If social_sections is enabled, info about what section
    they are in is also passed.

    Args:
        school (:obj:`str`): the school code (e.g. 'jhu')
        student (:obj:`Student`): the student for whom to find classmates
        course_id (:obj:`int`): the database id for the course
        semester (:obj:`Semester`): the semester that is current (to check for)
        friends (:obj:`list` of :obj:`Students`):
            if provided, does not re-query for friends list, uses provided list.
        include_same_as (:obj:`bool`):
            If provided as true, searches for classmates in any courses marked
            as "same as" in the database.
    """
    if not friends:
        friends = student.friends.filter(social_courses=True)
    past_ids = [course_id]
    if include_same_as:
        c = Course.objects.get(id=course_id)
        if c.same_as:
            past_ids.append(c.same_as.id)
    curr_ptts = PersonalTimetable.objects.filter(student__in=friends, courses__id__exact=course_id) \
        .filter(Q(semester=semester)).order_by('student', 'last_updated').distinct('student')
    past_ptts = PersonalTimetable.objects.filter(student__in=friends, courses__id__in=past_ids) \
        .exclude(student__in=curr_ptts.values_list('student', flat=True)).filter(~Q(semester=semester)) \
        .order_by('student', 'last_updated').distinct('student')

    return {
        'current': get_classmates_from_tts(student, course_id, curr_ptts),
        'past': get_classmates_from_tts(student, course_id, past_ptts),
    }


def get_classmates_from_tts(student, course_id, tts):
    """
    Returns a list of classmates a student has from a list
    of other user's timetables. This utility does the leg work
    for :meth:`get_classmates_from_course_id` by taking either a list
    of current or past timetables and finding classmates relevant to
    that list.

    If both students have social_offerings enabled, adds information about
    what sections the student is enrolled in on each classmate.
    """
    classmates = []
    for tt in tts:
        friend = tt.student
        classmate = model_to_dict(friend, exclude=['user', 'id', 'fbook_uid', 'friends', 'time_accepted_tos'])
        classmate['first_name'] = friend.user.first_name
        classmate['last_name'] = friend.user.last_name
        if student.social_offerings and friend.social_offerings:
            friend_sections = tt.sections.filter(course__id=course_id)
            sections = list(friend_sections.values_list('meeting_section', flat=True).distinct())
            classmate['sections'] = sections
        else:
            classmate['sections'] = []
        classmates.append(classmate)
    return classmates


def get_student_tts(student, school, semester):
    """
    Returns serialized list of a student's :obj:`PersonalTimetable` objects
    ordered by last updated for passing to the frontend.
    """
    timetables = student.personaltimetable_set.filter(
        school=school, semester=semester).order_by('-last_updated')
    return DisplayTimetableSerializer.from_model(timetables, many=True).data
