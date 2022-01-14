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

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from hashids import Hashids

from .jhu_final_exam_scheduler import JHUFinalExamScheduler
from helpers.mixins import FeatureFlowView, CsrfExemptMixin
from exams.models import FinalExamShare
from student.utils import get_student
from semesterly.settings import get_secret

hashids = Hashids(salt=get_secret('HASHING_SALT'))


# TODO: use new request shape
class ExamView(CsrfExemptMixin, APIView):

    def post(self, request):
        final_exam_schedule = JHUFinalExamScheduler().make_schedule(request.data)
        return Response(final_exam_schedule, status=status.HTTP_200_OK)


class ExamLink(FeatureFlowView):
    feature_name = 'SHARE_EXAM'

    def get_feature_flow(self, request, slug):
        exam_id = hashids.decrypt(slug)[0]
        exam_json = get_object_or_404(FinalExamShare, id=exam_id).exam_json
        exam_schedule = JHUFinalExamScheduler().make_schedule(exam_json)
        return {'exam': exam_schedule}

    def post(self, request):
        new_link = FinalExamShare.objects.create(
            school=request.subdomain,
            student=get_student(request),
            exam_json=request.data
        )
        new_link.save()

        response = {'slug': hashids.encrypt(new_link.id)}
        return Response(response, status.HTTP_200_OK)
