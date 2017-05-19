from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from hashids import Hashids

from timetable.jhu_final_exam_scheduler import JHUFinalExamScheduler
from timetable.utils import FeatureFlowView, CsrfExemptMixin
from exams.models import FinalExamShare
from student.utils import get_student


hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")


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
