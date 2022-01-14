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

from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from timetable.models import CourseIntegration
from helpers.mixins import ValidateSubdomainMixin
from integrations.serializers import CourseIntegrationSerializer


class IntegrationsView(ValidateSubdomainMixin, APIView):
    def get(self, request, integration_id, course_id):
        integration = get_object_or_404(
            CourseIntegration, integration_id=integration_id, course_id=course_id
        )
        return Response(
            CourseIntegrationSerializer(integration).data, status=status.HTTP_200_OK
        )

    def post(self, request, integration_id, course_id):
        CourseIntegration.objects.update_or_create(
            course_id=course_id,
            integration_id=integration_id,
            defaults={"json": request.data["json"]},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, integration_id, course_id):
        CourseIntegration.objects.filter(
            course_id=course_id, integration_id=integration_id
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
