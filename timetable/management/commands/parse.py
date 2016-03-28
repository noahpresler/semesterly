from django.core.management.base import BaseCommand, CommandError
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import Updates
from timetable.school_mappers import course_parsers
from scripts.populator import *
import datetime, logging, os, sys


class Command(BaseCommand):
  help = "Initiates specified parsers for specified schools. If no school \
  is provided, starts parsers for all schools."
  def add_arguments(self, parser):
  	 	# optional argument to specify parser for specific school
  	 	parser.add_argument('school', nargs='?', default='')

  def success_print(self, message):
  	try:
		self.stdout.write(self.style.SUCCESS(message))
	except:
		self.stdout.write(message)

  def handle(self, *args, **options):
  	logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

  	VALID_SCHOOLS=['jhu', 'umd', 'rutgers', 'uoft']

  	schools = VALID_SCHOOLS
  	if options['school']:
  		if options['school'] in VALID_SCHOOLS:
  			schools = [options['school']]
  		else:
			self.stderr.write(self.style.ERROR("Invalid school provided. Valid options are: " + str(VALID_SCHOOLS)))
			exit(1)


	for school, do_parse in course_parsers.iteritems():
  		if school in schools:
			try:

				message = "Starting parser for %s.\n" % (school)
				self.success_print(message)
				logging.exception(message)

				do_parse()
				# populate the JSON files in timetables/courses_json
				start_JSON_populator(school, "F")
				start_JSON_populator(school, "S")

				# set the last_updated information for the school's courses
				update_object, created = Updates.objects.update_or_create(
					school=school,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
				)

			except Exception as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(error)
				self.stderr.write(self.style.ERROR(error))

	self.success_print("Finished!")
