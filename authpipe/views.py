import json

from django.http import HttpResponse
from django.forms import model_to_dict
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from student.models import RegistrationToken
from student.utils import get_student
from timetable.utils import validate_subdomain


@csrf_exempt
@validate_subdomain
def set_registration_token(request):
    token = json.loads(request.body)['token']
    school = request.subdomain
    student = get_student(request)
    rt, rt_was_created = RegistrationToken.objects.update_or_create(auth=token['keys']['auth'],
                                                                    p256dh=token['keys']['p256dh'],
                                                                    endpoint=token['endpoint'])
    if student:
        rt.student = student
        rt.save()
        student.school = school
        student.save()
    json_data = {
        'token': 'yes'
    }
    return HttpResponse(json.dumps(json_data), content_type="application/json")


@csrf_exempt
def delete_registration_token(request):
    token = json.loads(request.body)['token']
    RegistrationToken.objects.filter(endpoint=token['endpoint']).delete()
    json_data = {
        'token': 'deleted'
    }
    return HttpResponse(json.dumps(json_data), content_type="application/json")


class RegistrationTokenView(APIView):

    def put(self, request):
        token = request.data
        school = request.subdomain
        student = get_student(request)
        rt, rt_was_created = RegistrationToken.objects.update_or_create(auth=token['auth'],
                                                                        p256dh=token['p256dh'],
                                                                        endpoint=token['endpoint'])
        if student:
            rt.student = student
            rt.save()
            student.school = school
            student.save()

        return Response(model_to_dict(rt), status=status.HTTP_201_CREATED)

    def delete(self, request, endpoint):
        to_delete = RegistrationToken.objects.filter(endpoint=endpoint)
        if to_delete.exists():
            to_delete.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
