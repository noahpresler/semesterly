from rest_framework import serializers
from notifications.models import NewsUpdate


class NewsUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsUpdate
        fields = ("title", "body", "date")
