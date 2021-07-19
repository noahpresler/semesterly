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

from django.db import models

from timetable.models import Semester


class DataUpdate(models.Model):
    """
    Stores the date/time that the school's data was last updated.

    Scheduled updates occur when digestion into the database completes.

    Attributes:
        school (CharField): the school code that was updated (e.g. jhu)
        semester (:obj:`ForeignKey` to :obj:`Semester`): the semester for the
            update
        last_updated (DateTimeField): the datetime last updated
        reason (CharField): the reason it was updated
            (default Scheduled Update)
        update_type (CharField): which field was updated
        UPDATE_TYPE (:obj:`tuple` of :obj:`tuple`): Update types allowed.
        COURSES (str): Update type.
        EVALUATIONS (str): Update type.
        MISCELLANEOUS (str): Update type.
        TEXTBOOKS (str): Update type.
    """

    COURSES = 'C'
    TEXTBOOKS = 'T'
    EVALUATIONS = 'E'
    MISCELLANEOUS = 'M'
    UPDATE_TYPE = (
        (COURSES, 'courses'),
        (TEXTBOOKS, 'textbooks'),
        (EVALUATIONS, 'evaluations'),
        (MISCELLANEOUS, 'miscellaneous'),
    )

    school = models.CharField(max_length=100)
    semester = models.ForeignKey(Semester, on_delete=models.deletion.CASCADE)
    timestamp = models.DateTimeField(auto_now=True)
    reason = models.CharField(max_length=200, default='Scheduled Update')
    update_type = models.CharField(max_length=1,
                                   choices=UPDATE_TYPE,
                                   default=MISCELLANEOUS)
