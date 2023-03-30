from django.core.management.base import BaseCommand
from django.db.models import Q
from timetable.models import Semester

class Command(BaseCommand):
    help = 'Delete semester objects for a given year, which deletes all courses, sections, and timetables associated with them.'

    def add_arguments(self, parser):
        parser.add_argument('year', type=str)

    def handle(self, *args, **options):
        year = options['year']
        print('Deleting courses, sections, and timetables for year: ', year)
        self.delete_year(year)
      
    def delete_year(self, year):
        Semester.objects.filter(Q(year=year)).delete()

