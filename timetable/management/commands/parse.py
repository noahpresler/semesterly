import os, django, datetime, logging, sys, argparse
from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.models import Updates
from timetable.school_mappers import course_parsers, new_course_parsers
from timetable.management.commands.args_parse import schoollist_argparser, parser_argparser, validator_argparser

class Command(BaseCommand):
	help = "Initiates specified parsers for specified schools. If no school is provided, starts parsers for all schools."
	def add_arguments(self, parser):
		cmd = self

		# NOTE: already specified:
		#       --no-color        
		#       --verbosity

		# Provide list of schools to parse; none implies all
		schoollist_argparser(parser)

		# Options for course parsers
		parser_argparser(parser)

		# Options for validation
		validator_argparser(parser)

	def success_print(self, message):
		try:
			self.stdout.write(self.style.SUCCESS(message))
		except: # TODO - why this except block? when will this fail?
			self.stdout.write(message) 

	def handle(self, *args, **options):
		logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

		for school in options['schools']:
			parser = new_course_parsers[school]
			message = "Starting parser for %s.\n" % (school)
			self.success_print(message)
			logging.exception(message) # TODO - WHY IS THIS an exception?
			# TODO - log command line options

			try:
				parser(school,
					validate=options['validate'],
					config=options.get('config_file'),
					output_filepath=options.get('output'),
					output_error_filepath=options.get('output_error'),
					break_on_error=options['break_on_error'],
					break_on_warning=options['break_on_warning'],
					hide_progress_bar=options['hide_progress_bar'],
					skip_shallow_duplicates=options['skip_shallow_duplicates']
				).start(
					verbosity=options['verbosity'],
					year=options['term_and_year'][1] if options.get('term_and_year') else None,
					term=options['term_and_year'][0] if options.get('term_and_year') else None,
					department=options.get('department'),
					textbooks=options['textbooks']
				)

			# TODO - catch JsonValidationError
			# TODO - catch CourseParseError as well
			except ValueError as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(error)
				self.stderr.write(self.style.ERROR(error))

		self.success_print("Finished!")
