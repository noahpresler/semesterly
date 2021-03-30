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

from rest_framework import serializers

from courses.serializers import CourseSerializer
from timetable.serializers import DisplayTimetableSerializer
from forum.serializers import TranscriptSerializer
from student.models import Student


def get_student_dict(school, student, semester):
    """ Return serialized representation of a student. """
    user_dict = {'timeAcceptedTos': None, 'isLoggedIn': False, 'timetables': [], 'courses': []}
    if student is not None:
        user_dict = dict(user_dict, **StudentSerializer(student).data)
        user_dict['isLoggedIn'] = True

        timetables = student.personaltimetable_set.filter(
            school=school, semester=semester).order_by('-last_updated')
        courses = {course for timetable in timetables for course in timetable.courses.all()}
        context = {'semester': semester, 'school': school, 'student': student}
        user_dict['timetables'] = DisplayTimetableSerializer.from_model(timetables, many=True).data
        user_dict['courses'] = CourseSerializer(courses, context=context, many=True).data
    return user_dict


class StudentSerializer(serializers.ModelSerializer):
    userFirstName = serializers.CharField(source='user.first_name')
    userLastName = serializers.CharField(source='user.last_name')
    userFullName = serializers.CharField(source='get_full_name')
    # TODO: switch to camelCase
    FacebookSignedUp = serializers.BooleanField(source='is_signed_up_through_fb')
    GoogleSignedUp = serializers.BooleanField(source='is_signed_up_through_google')
    jhuSignedUp = serializers.BooleanField(source='is_signed_up_through_jhu')
    GoogleLoggedIn = serializers.BooleanField(source='is_logged_in_google')
    LoginToken = serializers.CharField(source='get_token')
    LoginHash = serializers.CharField(source='get_hash')
    timeAcceptedTos = serializers.DateTimeField(source='time_accepted_tos', format='iso-8601')
    owned_transcripts = TranscriptSerializer(many=True)
    invited_transcripts = TranscriptSerializer(many=True)

    class Meta:
        model = Student
        fields = (
            'class_year',
            'img_url',
            'fbook_uid',
            'major',
            'social_courses',
            'social_offerings',
            'social_all',
            'emails_enabled',
            'school',
            'integrations',
            'userFirstName',
            'userLastName',
            'FacebookSignedUp',
            'GoogleSignedUp',
            'jhuSignedUp',
            'GoogleLoggedIn',
            'LoginToken',
            'LoginHash',
            'timeAcceptedTos',
            'owned_transcripts',
            'invited_transcripts',
            'userFullName'
        )
