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
from __future__ import unicode_literals
import semesterly.views

from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin, FeatureFlowView, RedirectToJHUSignupMixin
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from rest_framework import status, exceptions
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework.authentication import get_authorization_header, BaseAuthentication
from semesterly.settings import get_secret
from django.contrib.auth.mixins import LoginRequiredMixin
from django.conf import settings
from student.models import Student, PersonalTimetable
from advising.models import Advisor
from forum.models import Transcript
import jwt
import json
from courses.serializers import CourseSerializer


class AdvisingView(RedirectToJHUSignupMixin, FeatureFlowView):
    is_advising = True

    def get(self, request, *args, **kwargs):
        student = Student.objects.get(user=request.user)
        if not student.jhed:
            return HttpResponseRedirect('/advising/jhu_signup/')
        return FeatureFlowView.get(self, request, *args, **kwargs)

    def get_feature_flow(self, request, *args, **kwargs):
        """
        Return data needed for the feature flow for this HomeView.
        A name value is automatically added in .get() using the feature_name class variable.
        A semester value can also be provided, which will change the initial semester state of
        the home page.
        """
        return {}


class StudentSISView(ValidateSubdomainMixin, APIView):
    """ Handles SIS data retrieval and digesting. """

    def get(self, request, jhed=None):
        """Gets all of the semesters that SIS has retrieved from
        Assumes student has already received a POST request from SIS
        Only includes Fall and Spring semesters

        If the 'jhed' key is provided, get the semesters for the Student with
        the JHED. Requesting user must then be an advisor.

        Returns:
            retrievedSemesters: [<sem_name> <year>, ...]
            Ex: ["Fall 2019", "Spring 2020", "Fall 2020"]
        """
        if jhed:
            student = get_object_or_404(Student, jhed=jhed)
            advisor = Student.objects.get(user=request.user)
        else:
            student = Student.objects.get(user=request.user)
        semesters = set()
        for section in student.sis_registered_sections.all():
            if str(section.semester.name) == "Fall" or \
                    str(section.semester.name) == "Spring":
                semesters.add(section.semester)

        if jhed and student != advisor:
            semesters = list(
                map(lambda s: str(s),
                    sorted(
                        filter(lambda s: advisor in Transcript.objects.get_or_create(
                            owner=student, semester=s)[0].advisors.all(), semesters),
                        reverse=True)))
        else:
            semesters = list(
                map(lambda s: str(s),
                    sorted(semesters, reverse=True)))

        return Response({'retrievedSemesters': semesters},
                        status=status.HTTP_200_OK)

    def post(self, request, key=None):
        """Populates the database according to the SIS data.
        Fills students' advisors, majors, minors, and courses fields.
        """
        try:
            if key:
                payload = jwt.decode(request.body, key, algorithms=['HS256'])
            else:
                payload = jwt.decode(request.body, get_secret(
                    'STUDENT_SIS_AUTH_SECRET'), algorithms=['HS256'])
            if payload == "null":
                msg = 'Null token not allowed'
                raise exceptions.AuthenticationFailed(msg)
        except (jwt.ExpiredSignature, jwt.DecodeError, jwt.InvalidTokenError):
            return HttpResponse({'Error': "Token is invalid"}, status="403")
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise exceptions.AuthenticationFailed(msg)
        student = get_object_or_404(
            Student, jhed='{payload}{email}'.format(payload=payload['PersonalInfo']['JhedId'], email='@jh.edu'))
        self.add_advisors(payload, student)
        self.add_majors(payload, student)
        self.add_minors(payload, student)
        nonexistent_courses = self.add_courses(payload, student)
        student.save()
        return Response({'nonexistentCourses': nonexistent_courses},
                        status=status.HTTP_201_CREATED)

    def add_advisors(self, data, student):
        student.advisors.clear()
        for advisor_data in data['Advisors']:
            last_name, first_name = advisor_data['FullName'].split(',')
            advisor, created = Advisor.objects.get_or_create(
                jhed='{payload}{email}'.format(
                    payload=advisor_data['JhedId'], email='@jh.edu'),
                email_address=advisor_data['EmailAddress'],
                last_name=last_name.strip(), first_name=first_name.strip())
            advisor.save()
            student.advisors.add(advisor)

    def add_majors(self, data, student):
        student.primary_major = data['PersonalInfo']['PrimaryMajor']
        del student.other_majors[:]
        for major_data in data['NonPrimaryMajors']:
            student.other_majors.append(major_data['Major'])

    def add_minors(self, data, student):
        del student.minors[:]
        for minor_data in data['Minors']:
            student.minors.append(minor_data['MinorName'])

    def add_courses(self, data, student):
        nonexistent_courses = []
        student.sis_registered_sections.clear()
        for course_data in data['Courses']:
            try:
                course = Course.objects.get(code=course_data['OfferingName'])
            except Course.DoesNotExist:
                nonexistent_courses.append(course_data['OfferingName'])
                continue
            name, year = course_data['Term'].split(' ')
            semester = get_object_or_404(Semester, name=name, year=year)
            section = get_object_or_404(
                Section, course=course, semester=semester,
                meeting_section="({})".format(course_data['Section']))
            student.sis_registered_sections.add(section)
        return nonexistent_courses


class RegisteredCoursesView(ValidateSubdomainMixin, APIView):
    """Handles retrieving timetable and SIS courses from a specific semester"""

    def get(self, request, sem_name, year, jhed=None, tt_name=None):
        """If the 'jhed' key is provided, get the courses for the student with
        the corresponding JHED. The request user must be an Advisor. Otherwise,
        get the courses for the requesting student for this semester.

        If the 'tt_name' key is provided, the courses are first pulled from the
        personal timetable with the name 'tt_name'. These courses are then
        compared against the SIS registered sections, and if they match,
        isVerified is True. If no key is provided, all SIS registered courses
        will be returned with isVerified set to True for all of them.

        Optional data:
            jhed: The jhed of the student whose data is requested
            tt_name: The name of the timetable to compare against
        Returns:
            registeredCourses: {
                {**CourseSerializer(course1), isVerified: bool},
                {...},
            }
        """
        school = request.subdomain
        semester = Semester.objects.get(name=sem_name, year=year)
        if jhed:
            student = get_object_or_404(Student, jhed=jhed)
            if not self.is_advisor_for_student(request, student, semester):
                return Response(status=status.HTTP_403_FORBIDDEN)
        else:
            student = Student.objects.get(user=request.user)

        context = {'school': school, 'semester': semester, 'student': student}
        if tt_name:
            timetable = get_object_or_404(
                PersonalTimetable,
                student=student, name=tt_name,
                school=school, semester=semester)
            courses = self.get_registered_courses(context, timetable)
        else:
            courses = self.get_registered_courses(context)
        return Response(courses, status=status.HTTP_200_OK)

    def is_advisor_for_student(self, request, student, semester):
        advisor = Student.objects.get(user=request.user)
        if student == advisor:  # Student could be requesting their own data
            return True
        transcript = get_object_or_404(
            Transcript, owner=student, semester=semester)
        return student.jhed == transcript.owner.jhed \
            and advisor.is_advisor() \
            and advisor in transcript.advisors.all()

    def get_registered_courses(self, context, timetable=None):
        courses = {'registeredCourses': []}
        student, semester = context['student'], context['semester']
        registered_sections = student.sis_registered_sections.filter(
            semester=semester).all()
        if timetable:
            for section in timetable.sections.all():
                course_data = {'isVerified': section in registered_sections}
                courses['registeredCourses'].append(
                    dict(course_data, **CourseSerializer(section.course, context=context).data))
        else:
            for section in registered_sections:
                course_data = {'isVerified': True}
                courses['registeredCourses'].append(
                    dict(course_data, **CourseSerializer(section.course, context=context).data))
        return courses
