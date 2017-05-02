from django.forms import model_to_dict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from student.models import RegistrationToken
from student.utils import get_student
from timetable.utils import ValidateSubdomainMixin


class RegistrationTokenView(ValidateSubdomainMixin, APIView):

    def put(self, request):
        token = request.data
        school = request.subdomain
        student = get_student(request)
        token, _ = RegistrationToken.objects.update_or_create(auth=token['auth'],
                                                              p256dh=token['p256dh'],
                                                              endpoint=token['endpoint'])
        if student:
            token.student = student
            token.save()
            student.school = school
            student.save()

        return Response(model_to_dict(token), status=status.HTTP_201_CREATED)

    def delete(self, request, endpoint):
        to_delete = RegistrationToken.objects.filter(endpoint=endpoint)
        if to_delete.exists():
            to_delete.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
