from django.forms import model_to_dict
from rest_framework import serializers

from courses.serializers import get_section_dict
from courses.utils import is_waitlist_only
from student.models import PersonalTimetable
from timetable.utils import get_tt_rating


class SlotSerializer(serializers.Serializer):
    course = serializers.IntegerField(source='course.id')
    section = serializers.IntegerField(source='section.id')
    offerings = serializers.SerializerMethodField()
    is_optional = serializers.BooleanField()
    is_locked = serializers.BooleanField()

    def get_offerings(self, obj):
        return [offering.id for offering in obj.offerings]


class DisplayTimetableSerializer(serializers.Serializer):
    slots = SlotSerializer(many=True)
    has_conflict = serializers.BooleanField()
    name = serializers.CharField()
    avg_rating = serializers.FloatField()
