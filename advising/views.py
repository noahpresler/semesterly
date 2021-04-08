# -*- coding: utf-8 -*-
from student.models import Student
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from django.db import transaction

import semesterly.views

# currently unused. TODO: add get_feature_flow()

# feature_name = 'ADVISING'
import jwt
import json
from rest_framework import views
from rest_framework.response import Response
from models import User

class Login(views.APIView):
    def post(self, request, *args, **kwargs):
        if not request.data:
            return Response({'Error': "Please provide username/password"}, status="400")

        username = request.data['username']
        password = request.data['password']
        try:
            user = User.objects.get(username=username, password=password)
        except User.DoesNotExist:
            return Response({'Error': "Invalid username/password"}, status="400")
        if user:

            payload = {
                'id': user.id,
                'email': user.email,
            }
            jwt_token = {'token': jwt.encode(payload, "SECRET_KEY")}

           return HttpResponse(
              json.dumps(jwt_token),
              status=200,
              content_type="application/json"
            )
        else:
            return Response(
              json.dumps({'Error': "Invalid credentials"}),
              status=400,
              content_type="application/json"
            )
