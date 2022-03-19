from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpRequest

from notifications.models import NewsUpdate
from notifications.serializers import NewsUpdateSerializer
from helpers.mixins import ValidateSubdomainMixin


class NewsUpateView(ValidateSubdomainMixin, APIView):
    def get(self, request: HttpRequest):
        query = NewsUpdate.objects.order_by("-date").first()
        data = NewsUpdateSerializer(query).data
        return Response(data)
