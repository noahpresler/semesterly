from rest_framework import serializers

from timetable.models import Course


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = 'code name school description num_credits'.split()
