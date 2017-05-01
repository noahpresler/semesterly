import json

from django.http import HttpResponse

from django.views.decorators.csrf import csrf_exempt

from student.models import RegistrationToken
from student.views import get_student
from timetable.utils import validate_subdomain


@csrf_exempt
@validate_subdomain
def set_registration_token(request):
    token = json.loads(request.body)['token']
    school = request.subdomain
    student = get_student(request)
    rt, rt_was_created = RegistrationToken.objects.update_or_create(auth=token['keys']['auth'], p256dh=token['keys']['p256dh'], endpoint=token['endpoint'])
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