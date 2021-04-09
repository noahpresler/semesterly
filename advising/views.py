# -*- coding: utf-8 -*-
from student.models import Student
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from django.db import transaction

from django.contrib.auth.mixins import LoginRequiredMixin
from helpers.mixins import FeatureFlowView, RedirectToJHUSignupMixin
from django.http import HttpResponseRedirect


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
