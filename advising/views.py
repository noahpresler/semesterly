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

from django.shortcuts import get_object_or_404
from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin, FeatureFlowView, RedirectToJHUSignupMixin
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from student.models import Student
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from django.db import transaction
from rest_framework import status, exceptions
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework.authentication import get_authorization_header, BaseAuthentication
from semesterly.settings import get_secret
from django.contrib.auth.mixins import LoginRequiredMixin
from advising.models import Advisor
import jwt
import json

# TODO: Add comments for advising backend
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
    """ Handles advising interactions. """

    def post(self, request):
        """Creates a new 
        Required data:
            
        """
        try:
            print(request.body) # REMOVE THIS LATER! ONLY FOR TESTING
            payload = jwt.decode(request.body, get_secret(
                'STUDENT_SIS_AUTH_SECRET'), algorithms=['HS256'])
            print(payload) # REMOVE THIS LATER! ONLY FOR TESTING
            if payload == "null":
                msg = 'Null token not allowed'
                raise exceptions.AuthenticationFailed(msg)
        except jwt.ExpiredSignature or jwt.DecodeError or jwt.InvalidTokenError:
            return HttpResponse({'Error': "Token is invalid"}, status="403")
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise exceptions.AuthenticationFailed(msg)
        student = get_object_or_404(Student, jhed=payload['StudentInfo']['JhedId'])
        self.add_advisors(payload, student)
        self.add_majors(payload, student)
        self.add_minors(payload, student)
        self.add_courses(payload, student)
        student.save()
        return Response(status=status.HTTP_201_CREATED)

    def add_advisors(self, data, student):
        advisors = data['Advisors']
        for advisor_data in advisors:
            advisor = Advisor.objects.get_or_create(
                jhed=advisor_data['JhedId'], email_address=['EmailAddress'])
            student.advisors.add(advisor)
            advisor.save()

    def add_majors(self, data, student):
        student.primary_major = data['StudentInfo']['PrimaryMajor']
        student.other_majors.add(*[major_data['Major']
                                   for major_data in data['NonPrimaryMajors']])

    def add_minors(self, data, student):
        student.minors.add(*[minor_data['Minor']
                             for minor_data in data['Minors']])

    def add_courses(self, data, student):
        for course_data in data['Courses']:
            course = get_object_or_404(
                Course, code=course_data['OfferingName'])
            name, year = data['Term'].split(' ')
            semester = get_object_or_404(Semester, name=name, year=year)
            section = get_object_or_404(
                Section, course=course, semester=semester,
                meeting_section=course_data['SectionNumber'])
            student.sis_registered_courses.add(section)
