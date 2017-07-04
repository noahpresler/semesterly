from rest_framework import serializers

from student.models import PersonalEvent
from timetable.utils import DisplayTimetable


# TODO: move to student/serializers after removing get_student_tts?
class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = PersonalEvent
        exclude = ('id',)


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
    events = EventSerializer(many=True)

    @classmethod
    def from_model(cls, timetable, **kwargs):
        return DisplayTimetableSerializer(DisplayTimetable.from_model(timetable), **kwargs)
