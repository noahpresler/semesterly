import os, django, datetime, logging, sys, argparse, simplejson as json
from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.models import Updates
from timetable.school_mappers import course_parsers, new_course_parsers
from timetable.management.commands.args_parse import schoollist_argparser, parser_argparser, validator_argparser
from scripts.parser_library.internal_exceptions import *

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

	def handle(self, *args, **options):
		logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

		for school in options['schools']:
			message = 'Starting parser for {}.\n'.format(school)
			self.stdout.write(self.style.SUCCESS(message))
			logging.exception(message) # TODO - WHY IS THIS an exception?
			# TODO - log command line options

			parser = new_course_parsers[school]


			timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")

			directory = 'scripts/' + school
			if not options.get('config_file'):
				options['config_file'] = '{0}/config.json'.format(directory)
			if not options.get('output'):
				options['output'] = '{0}/data/courses.json'.format(directory)
			if not options.get('output_error_filepath'):
				options['output_error_filepath'] = '{0}/logs/error.log'.format(directory)
			if not options.get('master_log'):
				options['log_stats'] = '{0}/logs/master.log'.format(directory)

			try:
				parser(school,
					validate=options['validate'],
					config=options['config_file'],
					output_filepath=options['output'],
					output_error_filepath=options['output_error'],
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
			except CourseParseError as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(e)
				self.stderr.write(self.style.ERROR(str(e)))
			except (JsonValidationError, JsonValidationWarning, IngestorWarning) as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(e)
				self.stderr.write(self.style.ERROR(str(e)))

			# TODO - add more info to master logger
			self.log_stats(options['log_stats'], stats='INGESTING', timestamp=timestamp)

		self.log_stats(options['log_stats'], options=options, timestamp=timestamp)
		self.stdout.write(self.style.SUCCESS("Parsing Finished!"))

	def log_stats(self, filepath, options='', stats='', timestamp=''):
		'''Append run stat to master log.'''
		formatted_string = ''

		if timestamp:
			formatted_string += 'TIMESTAMP: ' + timestamp + '\n'
		if stats:
			formatted_string += stats + '\n'
		if options:
			formatted_string += 'OPTIONS:\n' + json.dumps(options, sort_keys=True, indent=2, separators=(',', ': ')) + '\n'

		with open(filepath, 'a') as log:
			log.write(formatted_string)
			log.write('='*40 + '\n')