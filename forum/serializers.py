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

from forum.models import Transcript, Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name')

    class Meta:
        model = Comment
        fields = (
            'author_name',
            'content',
            'timestamp',
        )


class TranscriptSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True)
    semester_name = serializers.CharField(source='semester.name')
    semester_year = serializers.CharField(source='semester.year')
    owner_name = serializers.CharField(source='owner.get_full_name')
    advisor_names = serializers.SerializerMethodField()

    def get_advisor_names(self, transcript):
        advisor_names = []
        for advisor in transcript.advisors.all():
            advisor_names.append(advisor.get_full_name())
        return advisor_names

    class Meta:
        model = Transcript
        fields = (
            'comments',
            'semester_name',
            'semester_year',
            'owner_name',
            'advisor_names',
        )
