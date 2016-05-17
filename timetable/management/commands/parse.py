from django.core.management.base import BaseCommand, CommandError
import os
import django
from timetable.models import Updates
from timetable.school_mappers import course_parsers
import datetime, logging, os, sys


class Command(BaseCommand):
  help = "Initiates specified parsers for specified schools. If no school is provided, starts parsers for all schools."
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

  	VALID_SCHOOLS = course_parsers.keys()

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
