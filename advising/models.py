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

""" Models pertaining to Students. """

from django.db import models
import timetable.models as timetable_models
import jwt
import json
# from rest_framework import views
# from rest_framework.response import Response
from models import User

# Create your models here.
# Sebastian Notes to self ->
# map section object (timetable) in object
# course object to map to offering
# courseobjects.filter(id)
# function to create many-to-many property (enrollments from list of sections)
# two tables for each majors and minors


class Student(models.Model):
    first_name = models.CharField(max_length=255, default='', null=True)
    last_name = models.CharField(max_length=255, default='', null=True)
    jhed_id = models.CharField(max_length=255, null=True, default='')
    primary_major = models.CharField(
        max_length=255, null=True, default='Undecided')
    email_address = models.CharField(
        max_length=255, null=True, default='Undecided')
    majors = models.ManyToOneField(Major)
    minors = models.ManyToOneField(Minor)


class Advisor(models.Model):
    students = models.ManyToManyField(models.Student)


class Major(model.Model):
    majors_name = models.CharField(max_length=255, default='', null=True)


class Minor(model.Model):
    minors_name = models.CharField(max_length=255, default='', null=True)

class Section(model.Model):
    # match to appropriate offering name
    sections = ManyToManyField(timetable_models.Course.code)
    section_id = ManyToManyField(timetable_models.Section.course_section_id)

# This may be unnecessary, attempting to understand PyJWT implementation
# class TokenAuthentication(BaseAuthentication):
#     model = None

#     def get_model(self):
#         return User

#     def authenticate(self, request):
#         auth = get_authorization_header(request).split()
#         if not auth or auth[0].lower() != b'token':
#             return None

#         if len(auth) == 1:
#             msg = 'Invalid token header. No credentials provided.'
#             raise exceptions.AuthenticationFailed(msg)
#         elif len(auth) > 2:
#             msg = 'Invalid token header'
#             raise exceptions.AuthenticationFailed(msg)

#         try:
#             token = auth[1]
#             if token == "null":
#                 msg = 'Null token not allowed'
#                 raise exceptions.AuthenticationFailed(msg)
#         except UnicodeError:
#             msg = 'Invalid token header. Token string should not contain invalid characters.'
#             raise exceptions.AuthenticationFailed(msg)

#         return self.authenticate_credentials(token)

#     def authenticate_credentials(self, token):
#         model = self.get_model()
#         payload = jwt.decode(token, "SECRET_KEY")
#         email = payload['email']
#         userid = payload['id']
#         msg = {'Error': "Token mismatch", 'status': "401"}
#         try:

#             user = User.objects.get(
#                 email=email,
#                 id=userid,
#                 is_active=True
#             )

#             if not user.token['token'] == token:
#                 raise exceptions.AuthenticationFailed(msg)

#         except jwt.ExpiredSignature or jwt.DecodeError or jwt.InvalidTokenError:
#             return HttpResponse({'Error': "Token is invalid"}, status="403")
#         except User.DoesNotExist:
#             return HttpResponse({'Error': "Internal server error"}, status="500")

#         return (user, token)

#     def authenticate_header(self, request):
#         return 'Token'
