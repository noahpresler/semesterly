from django.core.management.base import BaseCommand, CommandParser, CommandError
import os
import django
from timetable.models import Updates
from timetable.school_mappers import course_parsers
import datetime, logging, os, sys, argparse
from timetable.management.commands.args_parse import parser_argparser, validator_argparser

class Command(BaseCommand):
  help = "Initiates specified parsers for specified schools. If no school is provided, starts parsers for all schools."
  def add_arguments(self, parser):
  		cmd = self

		# NOTE: --no-color already specified
		# NOTE: verbosity already specified

  		# Setup Object for creating valid Django subparsers
  		# REF: http://stackoverflow.com/questions/36706220/is-it-possible-to-create-subparsers-in-a-django-management-command
		class SubParser(CommandParser):
			def __init__(self, **kwargs):
				super(SubParser, self).__init__(cmd, **kwargs)

  	 	# optional argument to specify parser for specific school
		parser.add_argument('school', nargs='?', default='', 
			help='(default: empty <> parse all schools')

		# ArgumentParser for course parsers
		parser_argparser(parser)

		# FIXME --no-validate and validator conflict without resolutoin
		validator_sub_parser = parser.add_subparsers(title="validator", parser_class=SubParser, help='options when validating parser output')
		validator = validator_sub_parser.add_parser('validator', help='run python manage.py parse [school] validator --help for more')
		validator_argparser(validator)

  def success_print(self, message):
  	try:
		self.stdout.write(self.style.SUCCESS(message))
	except:
		self.stdout.write(message)

  def handle(self, *args, **options):
  	print options
  	print options.get('textbooks')
  	print options.get('verbosity')
  	print options.get('term_and_year')
  	print options.get('validate')
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
