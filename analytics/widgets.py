from dashing.widgets import ListWidget
from dashing.widgets import GraphWidget

from student.views import get_student
from student.models import *
from analytics.models import *
from timetable.models import Semester
from timetable.school_mappers import VALID_SCHOOLS

from datetime import *
from collections import Counter

def number_timetables(**parameters):
    """
    Get the number of timetables filtered by any parameters. 
    Use Timetable to specify the table to filter.
    """
    Timetable = parameters.pop("Timetable") if "Timetable" in parameters else AnalyticsTimetable

    timetables = Timetable.objects.all()
    if "time_start" in parameters and "time_end" in parameters:
        timetables = (
            timetables.filter(
                time_created__range=(parameters.pop("time_start"), parameters.pop("time_end"))
            )
        )
    if "distinct" in parameters:
        timetables = timetables.distinct(parameters.pop("distinct"))
    timetables = timetables.filter(
        **{param: val for (param, val) in parameters.iteritems() if val is not None})
    return timetables.count()


class NumberTimetablesWidget(ListWidget):

    title = 'Number of Timetables'

    def get_updated_at(self):
        return u''

    def get_data(self):

        labels = [
            'Total',
            'Shared',
            'Personal'
        ]
        values = [
            number_timetables(),
            number_timetables(Timetable=SharedTimetable),
            number_timetables(Timetable=PersonalTimetable),
        ]

        return [ { 'label' : l, 'value': v } for l, v in zip(labels, values) ]


class NumberCalendarExportsWidget(ListWidget):

    title = 'Number of Calendar Exports'

    def get_updated_at(self):
        return u''

    def get_data(self):

        labels = [
            'Total',
            'Google Calendar',
            'ICS',
            'Exports by Unique Users'
        ]
        total        = number_timetables(Timetable=CalendarExport)
        google       = number_timetables(Timetable=CalendarExport, is_google_calendar=True)
        ics          = total - google
        unique_users = number_timetables(Timetable=CalendarExport, distinct="student")

        values = [
            total,
            google,
            ics,
            unique_users
        ]

        return [ { 'label' : l, 'value': v } for l, v in zip(labels, values) ]
