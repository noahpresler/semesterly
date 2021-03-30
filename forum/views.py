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

from django.shortcuts import render
from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin
from student.models import Student
from timetable.models import Semester
from forum.models import Transcript
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from serializers import TranscriptSerializer


class ForumView(RedirectToSignupMixin, ValidateSubdomainMixin, APIView):
    """ Returns all forums for the user making the request. """

    def get(self, request):
        student = Student.objects.get(user=request.user)
        return Response(
            {'invited_transcripts': TranscriptSerializer(
                student.invited_transcripts, many=True).data,
             'owned_transcripts': TranscriptSerializer(
                 student.owned_transcripts, many=True).data},
            status=status.HTTP_200_OK)


class ForumTranscriptView(RedirectToSignupMixin, ValidateSubdomainMixin, APIView):
    def get(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)
        transcript = Transcript.objects.get(owner=student, semester=semester)
        return Response('transcript', TranscriptSerializer(transcript).data)


    def post(self, request, sem_name, year):
        pass

    def put(self, request, sem_name, year):
        pass

    def patch(self, request, sem_name, year):
        pass

    def delete(self, request, sem_name, year):
        pass
