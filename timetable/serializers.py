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

import itertools
from rest_framework import serializers

from student.models import PersonalEvent
from timetable.utils import DisplayTimetable


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalEvent
        exclude = ("id",)


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
    avg_rating = serializers.FloatField()
    events = EventSerializer(many=True)

    @classmethod
    def from_model(cls, timetable, **kwargs):
        if kwargs.get("many") is True:
            timetables = [DisplayTimetable.from_model(tt) for tt in timetable]
            return DisplayTimetableSerializer(timetables, **kwargs)
        return DisplayTimetableSerializer(
            DisplayTimetable.from_model(timetable), **kwargs
        )
