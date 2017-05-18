from braces.views import CsrfExemptMixin
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from timetable.utils import FeatureFlowView
from agreement.models import TermOfService
from student.utils import get_student

class TosLink(FeatureFlowView):
    feature_name = 'SHOW_AGREEMENT_MODAL'

    def get_feature_flow(self, request, slug):
        show_tos = True
        return {'show_ts': show_tos}
