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


from __future__ import absolute_import
from rest_framework import serializers

from agreement.models import Agreement

class AgreementSerializer(serializers.ModelSerializer):
    timeUpdated = serializers.DateTimeField(source='last_updated')
    description = serializers.CharField()
    url = serializers.CharField()

    class Meta:
        model = Agreement
        fields = (
            'timeUpdated',
            'description',
            'url',
        )
