from rest_framework import serializers

from timetable.models import Course


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ('code', 'name', 'id', 'description', 'department', 'num_credits', 'areas', 'campus')