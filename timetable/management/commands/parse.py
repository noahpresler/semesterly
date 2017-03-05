import os, django, datetime, logging, sys, argparse, simplejson as json, logging, traceback
from timeit import default_timer as timer

from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.models import Updates
from timetable.school_mappers import course_parsers, new_course_parsers, new_textbook_parsers
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
		stat_log = []

		timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")

		for school in options['schools']:

			# Use old parser framework if no new parser available
			if school not in new_course_parsers or (options['textbooks'] and school not in new_textbook_parsers):
				do_parse = course_parsers[school]
				self.old_parser(do_parse, school)
				continue

			parser, parser_type = None, ''
			if options['textbooks']:
				parser = new_textbook_parsers[school]
				parser_type = 'textbooks'
			else:
				parser = new_course_parsers[school]
				parser_type = 'courses'

			message = 'Starting {} parser for {}.\n'.format(parser_type, school)
			self.stdout.write(self.style.SUCCESS(message))
			logging.exception(message) # TODO - WHY IS THIS an exception?

			directory = 'scripts/' + school
			if not options.get('config_file'):
				options['config_file'] = '{}/config.json'.format(directory)
			if not options.get('output'):
				options['output'] = '{}/data/{}.json'.format(directory, parser_type)
			if not options.get('output_error_filepath'):
				options['output_error_filepath'] = '{}/logs/error_{}.log'.format(directory, parser_type)
			if not options.get('master_log'):
				options['log_stats'] = 'scripts/logs/master.log'

			try:
				p = parser(school,
					validate=options['validate'],
					config=options['config_file'],
					output_filepath=options['output'],
					output_error_filepath=options['output_error'],
					break_on_error=options['break_on_error'],
					break_on_warning=options['break_on_warning'],
					hide_progress_bar=options['hide_progress_bar'],
					skip_shallow_duplicates=options['skip_shallow_duplicates']
				)

				start_time = timer()
				p.start(
					verbosity=options['verbosity'],
					year=options['term_and_year'][1] if options.get('term_and_year') else None,
					term=options['term_and_year'][0] if options.get('term_and_year') else None,
					department=options.get('department'),
					textbooks=options['textbooks']
				)
				end_time = timer()

				if hasattr(p, 'get_stats') and callable(p.get_stats):
					stat_log.append('({}) [Elapsed Time: {:.2f}s] {}'.format(school, end_time - start_time, p.get_stats()))
				else:
					stat_log.append('({}) [Elapsed Time: {:.2f}s] ==INGESTING=='.format(school, end_time - start_time))

			except CourseParseError as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(e)
				self.stderr.write(self.style.ERROR(str(e)))
			except (JsonValidationError, JsonValidationWarning, IngestorWarning) as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(e)
				self.stderr.write(self.style.ERROR(str(e)))
			except Exception as e:
				logging.exception(e)
				self.stderr.write(self.style.ERROR(str(e)))
				traceback.print_exc()

		self.stdout.write(self.style.SUCCESS("Parsing Finished!"))
		Command.log_stats(options['log_stats'], stats=stat_log, options=options, timestamp=timestamp)

	def old_parser(self, do_parse, school):
		message = 'Starting {} parser for {}.\n'.format('courses', school)
		self.stdout.write(self.style.SUCCESS(message))
		try:
			do_parse()
		except Exception as e:
			self.stderr.write(str(e))
			Command.log_stats('scripts/logs/master.log', timestamp=str(e))

	@staticmethod
	def log_stats(filepath, options='', stats=None, timestamp='', elapsed=None):
		'''Append run stat to master log.'''
		formatted_string = ''

		if timestamp:
			formatted_string += 'TIMESTAMP: ' + timestamp + '\n'
		if elapsed:
			formatted_string += 'ELAPSED: ' + str(elapsed) + '\n'
		if stats:
			formatted_string += '\n'.join(stat for stat in stats) + '\n'
		if options:
			formatted_string += 'OPTIONS:\n' + json.dumps(options, sort_keys=True, indent=2, separators=(',', ': ')) + '\n'

		with open(filepath, 'a') as log:
			log.write(formatted_string)
			log.write('='*40 + '\n')
