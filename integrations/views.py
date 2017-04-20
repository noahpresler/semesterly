import json

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from timetable.models import CourseIntegration
from timetable.utils import validate_subdomain
from integrations.serializers import CourseIntegrationSerializer


@csrf_exempt
@validate_subdomain
def get_integration(request, integration_id, course_id):
    has_integration = False
    if CourseIntegration.objects.filter(course_id=course_id, integration_id=integration_id):
        has_integration = True
    return HttpResponse(json.dumps({'integration_enabled': has_integration}), content_type="application/json")


@csrf_exempt
@validate_subdomain
def delete_integration(request, integration_id, course_id):
    CourseIntegration.objects.filter(course_id=course_id, integration_id=integration_id).delete()
    return HttpResponse(json.dumps({'deleted': True}), content_type="application/json")


@csrf_exempt
@validate_subdomain
def add_integration(request, integration_id, course_id):
    desc = json.loads(request.body)['json']
    link, created = CourseIntegration.objects.update_or_create(course_id=course_id, integration_id=integration_id,
                                                               json=desc)
    return HttpResponse(json.dumps({'created': created}), content_type="application/json")


class IntegrationsView(APIView):

    def get(self, request, integration_id, course_id):
        integration = get_object_or_404(CourseIntegration, integration_id=integration_id, course_id=course_id)
        return Response(CourseIntegrationSerializer(integration).data, status=status.HTTP_200_OK)

    def post(self, request):
        CourseIntegration.objects.update_or_create(course_id=request.data['course_id'],
                                                   integration_id=request.data['integration_id'],
                                                   json=request.data['json'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, integration_id, course_id):
        CourseIntegration.objects.filter(course_id=course_id, integration_id=integration_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
