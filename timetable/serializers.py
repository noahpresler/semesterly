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

from rest_framework import serializers

from student.models import PersonalEvent
from timetable.utils import DisplayTimetable


class EventSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        instance.name = validated_data.get("name", instance.name)
        instance.day = validated_data.get("day", instance.day)
        instance.time_start = validated_data.get("time_start", instance.time_start)
        instance.time_end = validated_data.get("time_end", instance.time_end)
        instance.color = validated_data.get("color", instance.color)
        instance.location = validated_data.get("location", instance.location)
        instance.credits = validated_data.get("credits", instance.credits)
        instance.save()
        return instance

    class Meta:
        model = PersonalEvent
        fields = "__all__"


class SlotSerializer(serializers.Serializer):
    course = serializers.IntegerField(source="course.id")
    section = serializers.IntegerField(source="section.id")
    offerings = serializers.SerializerMethodField()
    is_optional = serializers.BooleanField()
    is_locked = serializers.BooleanField()

    def get_offerings(self, obj):
        return [offering.id for offering in obj.offerings]


class DisplayTimetableSerializer(serializers.Serializer):
    id = serializers.IntegerField(
        allow_null=True
    )  # should only be defined for PersonalTimetables
    slots = SlotSerializer(many=True)
    has_conflict = serializers.BooleanField()
    name = serializers.CharField()
    events = EventSerializer(many=True)

    @classmethod
    def from_model(cls, timetable, **kwargs):
        if kwargs.get("many") is True:
            timetables = [DisplayTimetable.from_model(tt) for tt in timetable]
            return DisplayTimetableSerializer(timetables, **kwargs)
        return DisplayTimetableSerializer(
            DisplayTimetable.from_model(timetable), **kwargs
        )
