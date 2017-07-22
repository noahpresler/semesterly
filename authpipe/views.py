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

from django.forms import model_to_dict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from student.models import RegistrationToken
from student.utils import get_student
from helpers.mixins import ValidateSubdomainMixin


class RegistrationTokenView(ValidateSubdomainMixin, APIView):
    """
    Handles registration and deletion of tokens for maintaining
    chrome notifications for users who choose to enable the feature.
    """

    def put(self, request):
        """
        Creates a notification token for the user.
        """
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
