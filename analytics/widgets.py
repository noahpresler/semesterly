from dashing.widgets import Widget
from dashing.widgets import GraphWidget
from dashing.widgets import ListWidget
from dashing.widgets import NumberWidget

from student.views import get_student
from student.models import *
from analytics.models import *
from timetable.models import Semester
from timetable.school_mappers import VALID_SCHOOLS

from datetime import *
from collections import Counter


def number_students_by_school():
    """
    Get the number of students filtered by each school.
    """
    num_students = {}
    for school in VALID_SCHOOLS:
        ids = PersonalTimetable.objects              \
                  .filter(school=school)             \
                  .values_list("student", flat=True) \
                  .distinct() 

        students = Student.objects.filter(id__in=ids) | Student.objects.filter(school=school)
        num_students[school] = students.count()
        
    return num_students


def number_students_by_class_year():
    """
    Get the number of students by class year.
    """
    valid_class_years = Student.objects.values("class_year").distinct()
    count_class_years = {}
    for class_year in valid_class_years:
        count_class_years[class_year["class_year"]] =                   \
            Student.objects.filter(class_year=class_year["class_year"]) \
                           .count()
    return count_class_years


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


def number_timetables_per_hour(Timetable=AnalyticsTimetable, school=None, 
                               start_delta_days=1, interval_delta_hours=1):
    """
    Get the number of time tables created each hour. 
    Can be used for analytics or shared time tables.
    """
    # TODO: Change start and end time. Currently set for past 24 hours.
    time_end = datetime.now()
    length = timedelta(days = start_delta_days)
    time_start = time_end - length

    time_delta = timedelta(hours=interval_delta_hours)
    num_timetables = []
    while time_start < time_end:
        num_timetables.append(number_timetables(
            Timetable=Timetable,
            school=school,
            time_start=time_start,
            time_end=time_start + time_delta)
        )
        time_start += time_delta
    return num_timetables


def number_timetables_per_semester():
    num_timetables = {}
    for semester in Semester.objects.distinct():
        num_timetables[str(semester)] = number_timetables(semester=semester)
    return num_timetables


def number_of_reactions(max_only=False):
    """
    Get the the number of uses for each reaction. 
    If max_only is true, return only the reaction with the most uses.
    """
    # TODO: Could be modified for max AND number of each reaction.
    num_reactions = {}
    reaction_list = Reaction.REACTION_CHOICES
    for title, text in reaction_list:
        reaction = None
        reactions = Reaction.objects.filter(title=title)
        num_reactions[title] = len(reactions)
    if max_only:
        return max(num_reactions.iterkeys(), key=num_reactions.get)
    else:
        return num_reactions


class NumberTimetablesWidget(Widget):

    title = 'Number of Timetables'
    more_info = ''
    updated_at = ''
    total = ''
    shared = ''
    personal = ''

    def get_title(self):
        return self.title

    def get_more_info(self):
        return self.more_info

    def get_updated_at(self):
        return self.updated_at

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

    def get_context(self):
        return {
            'title'     : self.get_title(),
            'moreInfo'  : self.get_more_info(),
            'updatedAt' : self.get_updated_at(),
            'total'     : self.get_total(),
            'shared'    : self.get_shared(),
            'personal'  : self.get_personal(),
        }


class CalendarExportsWidget(ListWidget):

    title = 'Calendar Exports'

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


class FinalExamViewsWidget(NumberWidget):

    title = 'Final Exam Views'
    more_info = ''

    def get_value(self):
        return number_timetables(Timetable=FinalExamModalView)

    def get_detail(self):
        return (
            "%d unique" % 
            number_timetables(Timetable=FinalExamModalView, distinct="student")
        )
        

class TotalSignupsWidget(NumberWidget):

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


class FacebookAlertsViewsWidget(NumberWidget):

    title = 'Facebook Alert Views'
    more_info = ''

    def get_value(self):
        return number_timetables(Timetable=FacebookAlertView)

    def get_detail(self):
        return (
            "%d unique" % 
            number_timetables(Timetable=FacebookAlertView, distinct="student")
        )


class FacebookAlertsClicksWidget(NumberWidget):

    title = 'Facebook Alert Clicks'
    more_info = ''

    def get_value(self):
        return number_timetables(Timetable=FacebookAlertClick)

    def get_detail(self):
        return (
            "%d unique" % 
            number_timetables(Timetable=FacebookAlertClick, distinct="student")
        )


class SignupsPerDayWidget(GraphWidget):

    title = 'Signups Per Day'
    more_info = ''
    updated_at = ''
    
    def get_data(self):

        today = datetime.now()                           # First, get today's 
        dates = [                                        # date. For all dates
            (today - timedelta(days=i)).date()           # starting from 6 days
            for i in range(6, -1, -1)                    # ago until today.
        ]                                                # Convert to string
        labels = [ d.strftime('%m/%d') for d in dates ]  # format for labels.

        values = number_timetables_per_hour(
            Timetable=Student,
            start_delta_days=7, 
            interval_delta_hours=24
        )
        return {
            'labels' : labels,
            'values' : values
        }


class ReactionsWidget(GraphWidget):

    title = 'Reactions Used'
    more_info = ''
    updated_at = ''
    
    def get_data(self):
        reactions_data = number_of_reactions()
        labels = [ label for label in reactions_data.keys() ]
        values = [ value for value in reactions_data.values() ]
        return {
            'labels' : labels,
            'values' : values
        }


class UsersBySchoolWidget(GraphWidget):

    title = 'Users By School'
    more_info = ''
    updated_at = ''

    def get_data(self):
        num_students_by_school = number_students_by_school()
        labels = [ label for label in num_students_by_school.keys() ]
        values = [ value for value in num_students_by_school.values() ]
        return { 
            'labels' : labels,
            'values' : values
        }


class UsersByClassYearWidget(GraphWidget):

    title = 'Users By Class Year'
    more_info = ''
    updated_at = ''

    def get_data(self):
        num_students_by_class_year = number_students_by_class_year()
        labels = [ label for label in num_students_by_class_year.keys() ]
        values = [ value for value in num_students_by_class_year.values() ]
        return { 
            'labels' : labels,
            'values' : values
        }


class TimetablesBySchoolWidget(GraphWidget):

    title = 'Timetables By School'
    more_info = ''
    updated_at = ''

    def get_data(self):
        num_timetables_by_school = {}
        for school in VALID_SCHOOLS:
            num_timetables_by_school[school] = number_timetables(school=school)
        labels = [ label for label in num_timetables_by_school.keys() ]
        values = [ value for value in num_timetables_by_school.values() ]
        return { 
            'labels' : labels,
            'values' : values
        }


class TimetablesBySemesterWidget(GraphWidget):

    title = 'Timetables By Semester'
    more_info = ''
    updated_at = ''

    def get_data(self):
        num_timetables_by_semester = number_timetables_per_semester()
        labels = [ label for label in num_timetables_by_semester.keys() ]
        values = [ value for value in num_timetables_by_semester.values() ]
        return { 
            'labels' : labels,
            'values' : values
        }
