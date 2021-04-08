# -*- coding: utf-8 -*-
from student.models import Student
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from django.db import transaction

import semesterly.views

# currently unused. TODO: add get_feature_flow()

# feature_name = 'ADVISING'
# import jwt
# import json
# from rest_framework import views
# from rest_framework.response import Response
from models import User

