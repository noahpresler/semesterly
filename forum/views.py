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
from helpers.mixins import ValidateSubdomainMixin, RedirectToJHUSignupMixin
from student.models import Student
from timetable.models import Semester
from forum.models import Transcript, Comment
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from serializers import TranscriptSerializer, CommentSerializer


class ForumView(ValidateSubdomainMixin, RedirectToJHUSignupMixin, APIView):
    """ Handles the accessing of all user forum transcripts. """

    def get(self, request):
        """
        Returns all forum transcripts for the user making the request:
            owned_transcripts: Array of transcripts the user owns.
            invited_transcripts: Array of transcripts the user has been added to.
        """
        student = Student.objects.get(user=request.user)
        return Response(
            {'invited_transcripts': TranscriptSerializer(
                student.invited_transcripts, many=True).data,
             'owned_transcripts': TranscriptSerializer(
                 student.owned_transcripts, many=True).data},
            status=status.HTTP_200_OK)


class ForumTranscriptView(ValidateSubdomainMixin, RedirectToJHUSignupMixin, APIView):
    """ Handles the accessing of individual user forum transcripts. """

    def get(self, request, sem_name, year):
        """
        Returns the forum transcript associated with a particular semester or
        creates a new one if it doesn't exist for the user making the request:
            transcript: The retrieved transcript
        """

        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)
        transcript, created = Transcript.objects.get_or_create(
            owner=student, semester=semester)
        if created:
            return Response(
                {'transcript': TranscriptSerializer(transcript).data},
                status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'transcript': TranscriptSerializer(transcript).data},
                status=status.HTTP_200_OK)

    def post(self, request, sem_name, year):
        """Creates a new comment.
        Required data:
            content: The comment's message.
            timestamp: The time it was sent.
            jhed: The jhed of the owner of the transcript.
        """

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

    def patch(self, request, sem_name, year):
        """Adds or removes one advisor from a forum transcript.
        Required data:
            action: Either 'add' or 'remove'.
            jhed: The jhed of the advisor being added or removed.
        Returns:
            transcript: The modified transcript.
        """

        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)

        transcript = get_object_or_404(
            Transcript, owner=student, semester=semester)
        advisor = get_object_or_404(Student, jhed=request.data['jhed'])
        if request.data['action'] == 'add':
            if advisor not in transcript.advisors.all():
                transcript.advisors.add(advisor)
        elif request.data['action'] == 'remove':
            if advisor in transcript.advisors.all():
                transcript.advisors.remove(advisor)
        transcript.save()

        return Response({'transcript': TranscriptSerializer(transcript).data},
                        status=status.HTTP_200_OK)

    def delete(self, request, sem_name, year):
        """Deletes the forum transcript associated with a particular semester.
        """

        student = Student.objects.get(user=request.user)
        semester = Semester.objects.get(name=sem_name, year=year)
        transcript = Transcript.objects.filter(
            owner=student, semester=semester)
        if transcript.exists():
            transcript.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
