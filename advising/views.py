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
import semesterly.views # currently unused. TODO: add get_feature_flow()

from django.shortcuts import get_object_or_404
from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from student.models import Student
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from django.db import transaction

from rest_framework import status, exceptions
from django.http import HttpResponse
from rest_framework.authentication import get_authorization_header, BaseAuthentication
import jwt
import json
# from serializers import TODO: Add serializers

# Will be updated to follow valid advising view

class AdvisingView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    """ Handles the accessing of all user forum transcripts. """
    def post(self, request):
        """Creates a new comment.
        Required data:
            ex. -> content: The comment's message.

        """
        try:
            payload = jwt.decode(get_secret("JWT_AUTH_JHED_TOKEN"), 'SECRET', algorithms=['HS256'])
            if payload == "null":
                msg = 'Null token not allowed'
                raise exceptions.AuthenticationFailed(msg)
        except jwt.ExpiredSignature or jwt.DecodeError or jwt.InvalidTokenError:
            return HttpResponse({'Error': "Token is invalid"}, status="403")
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise exceptions.AuthenticationFailed(msg)
        print(payload)
        return Response(status=status.HTTP_201_CREATED)
    # def get(self, request):
    #     """
    #     Returns all 
    #     """
    #     student = Student.objects.get(user=request.user)
    #     return Response(
    #         {'invited_transcripts': TranscriptSerializer(
    #             student.invited_transcripts, many=True).data,
    #          'owned_transcripts': TranscriptSerializer(
    #              student.owned_transcripts, many=True).data},
    #         status=status.HTTP_200_OK)


# class ForumTranscriptView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
#     """ Handles the accessing of individual user forum transcripts. """

#     # def get(self, request, sem_name, year):
#     #     """
#     #     Returns 
#     #     """
        
#     #     student = Student.objects.get(user=request.user)
#     #     semester = Semester.objects.get(name=sem_name, year=year)
#     #     transcript = get_object_or_404(
#     #         Transcript, owner=student, semester=semester)
#     #     return Response({'transcript': TranscriptSerializer(transcript).data},
#     #                     status=status.HTTP_200_OK)

#     def post(self, request, sem_name, year):
#         """Creates a new comment.
#         Required data:
#             ex. -> content: The comment's message.

#         """
#         try:
#             payload = jwt.decode(get_secret("JWT_AUTH_JHED_TOKEN"), 'SECRET', algorithms=['HS256'])
#             if payload == "null":
#                 msg = 'Null token not allowed'
#                 raise exceptions.AuthenticationFailed(msg)
#         except jwt.ExpiredSignature or jwt.DecodeError or jwt.InvalidTokenError:
#             return HttpResponse({'Error': "Token is invalid"}, status="403")
#         except UnicodeError:
#             msg = 'Invalid token header. Token string should not contain invalid characters.'
#             raise exceptions.AuthenticationFailed(msg)
#         print(payload)
#         return Response(status=status.HTTP_201_CREATED)

        # student = Student.objects.get(user=request.user)
        # semester = Semester.objects.get(name=sem_name, year=year)
        # transcript = get_object_or_404(
        #     Transcript,
        #     owner=Student.objects.get(jhed=request.data['jhed']),
        #     semester=semester)

        # if student not in transcript.advisors.all() and \
        #         student.jhed != transcript.owner.jhed:
        #     return Response(status=status.HTTP_403_FORBIDDEN)

        # comment = Comment.objects.create(author=student,
        #                                  content=request.data['content'],
        #                                  timestamp=request.data['timestamp'],
        #                                  transcript=transcript)
        # comment.save()

        # return Response(status=status.HTTP_201_CREATED)

    # Likely should not be able to change SIS-verified data &
    # users perhaps can "delete account" pending approval.

    # def put(self, request, sem_name, year):
    #     """Creates 
    #     Returns:

    #     """

    #     student = Student.objects.get(user=request.user)
    #     semester = Semester.objects.get(name=sem_name, year=year)

    #     transcript = Transcript.objects.filter(
    #         owner=student, semester=semester)
    #     if not transcript.exists():
    #         transcript = Transcript.objects.create(
    #             owner=student, semester=semester)
    #         transcript.save()

    #     return Response({'transcript': TranscriptSerializer(transcript).data},
    #                     status=status.HTTP_201_CREATED)

    # def patch(self, request, sem_name, year):
    #     """Adds or removes 
    #     Required data:
    #         action: 
    #     Returns:
    #         transcript: 
    #     """

    #     student = Student.objects.get(user=request.user)
    #     semester = Semester.objects.get(name=sem_name, year=year)

    #     transcript = get_object_or_404(
    #         Transcript, owner=student, semester=semester)
    #     advisor = get_object_or_404(Student, jhed=request.data['jhed'])
    #     if request.data['action'] == 'add':
    #         if advisor not in transcript.advisors.all():
    #             transcript.advisors.add(advisor)
    #     elif request.data['action'] == 'remove':
    #         if advisor in transcript.advisors.all():
    #             transcript.advisors.remove(advisor)
    #     transcript.save()

    #     return Response({'transcript': TranscriptSerializer(transcript).data},
    #                     status=status.HTTP_200_OK)

    # def delete(self, request, sem_name, year):
    #     """Deletes 
    #     """

    #     student = Student.objects.get(user=request.user)
    #     semester = Semester.objects.get(name=sem_name, year=year)
    #     transcript = Transcript.objects.filter(
    #         owner=student, semester=semester)
    #     if transcript.exists():
    #         transcript.delete()

        # return Response(status=status.HTTP_204_NO_CONTENT)

