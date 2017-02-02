from django.core.management.base import BaseCommand, CommandParser, CommandError
import os
import django
from timetable.models import Updates
from timetable.school_mappers import course_parsers, new_course_parsers
import datetime, logging, os, sys, argparse
from timetable.management.commands.args_parse import parser_argparser, validator_argparser

class Command(BaseCommand):
	help = "Initiates specified parsers for specified schools. If no school is provided, starts parsers for all schools."
	def add_arguments(self, parser):
		cmd = self

		# NOTE: already specified:
		#       --no-color        
		#       --verbosity

		# Handles nargs='*' with strict choices and set to all schools if empty
		class school_verifier_action(argparse.Action):
			VALID_SCHOOLS = new_course_parsers.keys()
			def __call__(self, parser, namespace, values, option_string=None):
				for value in values:
					if value not in school_verifier_action.VALID_SCHOOLS:
						raise parser.error('invalid school: {0!r} (choose from [{1}])'
							.format(value, ', '.join(school_verifier_action.VALID_SCHOOLS)))
				if values:
					setattr(namespace, self.dest, values)
				else:
					setattr(namespace, self.dest, school_verifier_action.VALID_SCHOOLS)

		# optional argument to specify parser for specific school
		parser.add_argument('schools', type=str, nargs=1, action=school_verifier_action,
			help='(default: all parseable schools)')
		# NOTE: Cannot support list of schools b/c conflicting cmd line flags, consider revising

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
					validate=options.get('validate'),
					config=options.get('config_file'),
					output_filepath=options.get('output'),
					output_error_filepath=options.get('output_error'),
					break_on_error=options['break_on_error'],
					break_on_warning=options['break_on_warning'],
					hide_progress_bar=options['hide_progress_bar']
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
