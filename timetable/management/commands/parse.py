from django.core.management.base import BaseCommand, CommandParser, CommandError
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
		parser.add_argument('-x', '--xerbosity', action='count', default=0,  
			help='increase output verbosity (none + terms + depts + courses + all)') 
		parser.add_argument('--department',  
			help='parse specific department by code')
		parser.add_argument('--year-and-term', nargs=2, type=str) 
		parser.add_argument('--detail', type=str, 
			help='parser specific handle')
		textbooks = parser.add_mutually_exclusive_group()
		textbooks.add_argument('--textbooks', dest='textbooks', action='store_true',
			help='parse textbooks')
		textbooks.add_argument('--no-textbooks', dest='textbooks', action='store_false',
			help='don\'t parse textbooks')
		textbooks.set_defaults(textbooks=False)

  def success_print(self, message):
  	try:
		self.stdout.write(self.style.SUCCESS(message))
	except:
		self.stdout.write(message)

  def handle(self, *args, **options):
  	print options.get('textbooks')
  	print options.get('xerbosity')
  	exit(2)

  	logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

  	schools_to_parse = course_parsers.keys()

  	schools = schools_to_parse
  	if options['school']:
  		if options['school'] in schools_to_parse:
  			schools = [options['school']]
  		else:
			self.stderr.write(self.style.ERROR("Invalid school provided. Valid options are: " + str(schools_to_parse)))
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
