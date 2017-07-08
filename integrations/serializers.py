from rest_framework import serializers

from timetable.models import CourseIntegration


class CourseIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseIntegration
        fields = '__all__'
