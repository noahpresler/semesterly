import json

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from timetable.models import CourseIntegration
from timetable.utils import validate_subdomain


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
