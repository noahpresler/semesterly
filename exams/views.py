from braces.views import CsrfExemptMixin
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from timetable.jhu_final_exam_scheduler import JHUFinalExamScheduler


class ExamView(CsrfExemptMixin, APIView):

    def post(self, request):
        final_exam_schedule = JHUFinalExamScheduler().make_schedule(request.data)
        return Response(final_exam_schedule, status=status.HTTP_200_OK)
