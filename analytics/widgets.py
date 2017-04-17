from dashing.widgets import GraphWidget
from dashing.widgets import ListWidget
from dashing.widgets import NumberWidget
from dashing.widgets import TimetablesWidget

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


class NumberTimetablesWidget(TimetablesWidget):

    title = 'Number of Timetables'

    def get_total(self):
        return number_timetables()

    def get_shared(self):
        return (
            "%d shared" % 
            number_timetables(Timetable=SharedTimetable)
        )

    def get_personal(self):
        return (
            "%d personal" % 
            number_timetables(Timetable=PersonalTimetable)
        )


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


class NumberFinalExamViewsWidget(NumberWidget):

    title = 'Final Exam Views'

    def get_value(self):
        return number_timetables(Timetable=FinalExamModalView)

    def get_detail(self):
        return (
            "%d unique" % 
            number_timetables(Timetable=FinalExamModalView, distinct="student")
        )

    def get_more_info(self):
        return ""

class NumberSignupsWidget(NumberWidget):

    title = 'Total Signups'

    def get_total_signups(self):
        self.total_signups = number_timetables(Timetable=Student)
        return self.total_signups

    def get_value(self):
        return self.get_total_signups()

    def get_detail(self):
        return ""

    def get_more_info(self):
        detail_string = ""

        permissions = ["social_courses", "social_offerings", "social_all"]
        for permission in permissions:
            # TODO: hacky way of passing in permission as an identifier for parameter. 
            # Also have to use tuple for template to easily access %.
            args = { 
                "Timetable" : Student, 
                permission  : True
            }
            num_users     = number_timetables(**args)
            percent_users = format(float(num_users) / self.get_total_signups() * 100, '.2f')

            detail_string += permission + (": %d (%s%%)\n" % (num_users, percent_users))
        
        return detail_string


class NumberFacebookAlertsViewsWidget(NumberWidget):

    title = 'Facebook Alert Views'

    def get_value(self):
        return number_timetables(Timetable=FacebookAlertView)

    def get_detail(self):
        return (
            "%d unique" % 
            number_timetables(Timetable=FacebookAlertView, distinct="student")
        )

    def get_more_info(self):
        return ""


class NumberFacebookAlertsClicksWidget(NumberWidget):

    title = 'Facebook Alert Clicks'

    def get_value(self):
        return number_timetables(Timetable=FacebookAlertClick)

    def get_detail(self):
        return (
            "%d unique" % 
            number_timetables(Timetable=FacebookAlertClick, distinct="student")
        )

    def get_more_info(self):
        return ""

