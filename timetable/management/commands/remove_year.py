"""
Deletes Sections, Offerings, and Timetables for a given year. 

Example usage: python manage.py remove_old_courses 2022
Removes all of the above for the year 2022
"""

from django.core.management.base import BaseCommand
from django.db.models import Q
from timetable.models import Semester


class Command(BaseCommand):
    help = "Delete semester objects for a given year, which deletes all courses, sections, and timetables associated with them."

    def add_arguments(self, parser):
        parser.add_argument("year", type=str)

    def handle(self, *args, **options):
        year = options["year"]
        print("Deleting courses, sections, and timetables for year: ", year)
        self.delete_year(year)

    def delete_year(self, year):
        Semester.objects.filter(Q(year=year)).delete()
