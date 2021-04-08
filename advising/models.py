# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.
# Sebastian Notes to self ->
# map section object (timetable) in object
# course object to map to offering
# courseobjects.filter(id)
# function to create many-to-many property (enrollments from list of sections)
# two tables for each majors and minors
import student.models as student_models
import timetable.models as timetable_models
import jwt
import json
from rest_framework import views
from rest_framework.response import Response
from models import User

class Student(models.Model):


class Advisor(models.Model):
    advisors = models.ManyToManyField(student_models.Student)


class Major(model.Model):
    majors = models.ManyToOneField(student_models.Student)


class Minor(model.Model):
    minors = models.ManyToOneField(student_models.Student)


class Section(model.Model):
    # must check through section id in timetable
    # sections = ManyToManyField()


class TokenAuthentication(BaseAuthentication):

    model = None

    def get_model(self):
        return User

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b'token':
            return None

        if len(auth) == 1:
            msg = 'Invalid token header. No credentials provided.'
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = 'Invalid token header'
            raise exceptions.AuthenticationFailed(msg)

        try:
            token = auth[1]
            if token == "null":
                msg = 'Null token not allowed'
                raise exceptions.AuthenticationFailed(msg)
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise exceptions.AuthenticationFailed(msg)

        return self.authenticate_credentials(token)

    def authenticate_credentials(self, token):
        model = self.get_model()
        payload = jwt.decode(token, "SECRET_KEY")
        email = payload['email']
        userid = payload['id']
        msg = {'Error': "Token mismatch", 'status': "401"}
        try:

            user = User.objects.get(
                email=email,
                id=userid,
                is_active=True
            )

            if not user.token['token'] == token:
                raise exceptions.AuthenticationFailed(msg)

        except jwt.ExpiredSignature or jwt.DecodeError or jwt.InvalidTokenError:
            return HttpResponse({'Error': "Token is invalid"}, status="403")
        except User.DoesNotExist:
            return HttpResponse({'Error': "Internal server error"}, status="500")

        return (user, token)

    def authenticate_header(self, request):
        return 'Token'
