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

from django.shortcuts import get_object_or_404
from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin
from student.models import Student
from timetable.models import Semester
from forum.models import Transcript, Comment
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from serializers import TranscriptSerializer, CommentSerializer


class ForumView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    """ Returns all forums for the user making the request. """

    def get(self, request):
        student = Student.objects.get(user=request.user)
        return Response(
            {'invited_transcripts': TranscriptSerializer(
                student.invited_transcripts, many=True).data,
             'owned_transcripts': TranscriptSerializer(
                 student.owned_transcripts, many=True).data},
            status=status.HTTP_200_OK)


class ForumTranscriptView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    def get(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)
        transcript = get_object_or_404(
            Transcript, owner=student, semester=semester)
        return Response({'transcript': TranscriptSerializer(transcript).data},
                        status=status.HTTP_200_OK)

    def post(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)
        transcript = get_object_or_404(
            Transcript,
            owner=Student.objects.get(jhed=request.data['jhed']),
            semester=semester)

        if student not in transcript.advisors.all() and \
                student.jhed != transcript.owner.jhed:
            return Response(status=status.HTTP_403_FORBIDDEN)

        comment = Comment.objects.create(author=student,
                                         content=request.data['content'],
                                         timestamp=request.data['timestamp'],
                                         transcript=transcript)
        comment.save()

        return Response(status=status.HTTP_201_CREATED)

    def put(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)

        transcript = Transcript.objects.filter(
            owner=student, semester=semester)
        if transcript.exists():
            return Response(status=status.HTTP_409_CONFLICT)
        else:
            transcript = Transcript.objects.create(
                owner=student, semseter=semester)
            transcript.save()

        return Response({'transcript': TranscriptSerializer(transcript).data},
                        status=status.HTTP_201_CREATED)

    def patch(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)

        transcript = get_object_or_404(
            Transcript, owner=student, semester=semester)
        advisor = get_object_or_404(Student, jhed=request.data['jhed'])
        if request.data['action'] == 'add':
            transcript.advisors.add(
                Student.objects.get(jhed=request.data['jhed']))
        elif request.data['action'] == 'remove':
            transcript.advisors.remove(
                Student.objects.get(jhed=request.data['jhed']))
        transcript.save()

        return Response({'transcript': TranscriptSerializer(transcript).data},
                        status=status.HTTP_200_OK)

    def delete(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)
        transcript = Transcript.objects.filter(owner=student, semester=semester)
        if transcript.exists():
            transcript.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
