from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from timetable.models import CourseIntegration
from timetable.utils import ValidateSubdomainMixin
from integrations.serializers import CourseIntegrationSerializer


class IntegrationsView(ValidateSubdomainMixin, APIView):

    def get(self, request, integration_id, course_id):
        integration = get_object_or_404(CourseIntegration, integration_id=integration_id, course_id=course_id)
        return Response(CourseIntegrationSerializer(integration).data, status=status.HTTP_200_OK)

    def post(self, request, integration_id, course_id):
        CourseIntegration.objects.update_or_create(course_id=course_id,
                                                   integration_id=integration_id,
                                                   defaults={'json': request.data['json']})
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, integration_id, course_id):
        CourseIntegration.objects.filter(course_id=course_id, integration_id=integration_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
