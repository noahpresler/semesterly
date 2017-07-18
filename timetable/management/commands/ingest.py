"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import os, django, datetime, logging, sys, argparse, simplejson as json, logging, traceback
from timeit import default_timer as timer

from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.models import Updates
from timetable.school_mappers import course_parsers, textbook_parsers, new_course_parsers, new_textbook_parsers
from timetable.management.commands.args_parse import schoollist_argparser, ingestor_argparser, validator_argparser
from scripts.parser_library.internal_exceptions import *
from scripts.parser_library.tracker import Tracker, LogFormatted

class Command(BaseCommand):
	help = "Initiates specified parsers for specified schools. If no school is provided, starts parsers for all schools."
	def add_arguments(self, parser):
		# NOTE: already specified:
		#       --no-color        
		#       --verbosity

		# Provide list of schools to parse; none implies all
		schoollist_argparser(parser)

		# Options for course ingestor
		ingestor_argparser(parser)

		# Options for validation
		validator_argparser(parser)

	@staticmethod
	def reset_options_for_new_school(options):
		options['config_file'] = None
		options['output'] = None
		options['output_error_filepath'] = None

	def handle(self, *args, **options):
		logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

		timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")

		for school in options['schools']:

			# Use old parser framework if no new parser available
			if options['textbooks'] and school not in new_textbook_parsers:
				do_parse = textbook_parsers[school]
				self.old_parser(do_parse, school)
				continue
			elif not options['textbooks'] and school not in new_course_parsers:
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

			tracker = Tracker(school)
			tracker.set_cmd_options(options)
			tracker.add_viewer(LogFormatted(options['log_stats']))

			p = parser(school,
				validate=options['validate'],
				config=options['config_file'],
				output_filepath=options['output'],
				output_error_filepath=options['output_error'],
				break_on_error=options['break_on_error'],
				break_on_warning=options['break_on_warning'],
				hide_progress_bar=options['hide_progress_bar'],
				skip_shallow_duplicates=options['skip_shallow_duplicates'],
				tracker=tracker
			)

			tracker.start()

			try:
				# Accept json defined years_and_terms.
				years_and_terms = json.loads(str(options.get('years_and_terms')))
				years_and_terms = {int(year): terms for year, terms in years_and_terms.items()}

				# TEMP: superficial hack to be completed once pep8 compliance is complete
				#  in order to avoid nasty merge conflicts, must integrate into each parser
				options['years'] = map(str, years_and_terms.keys())
				options['terms'] = []
				for terms in years_and_terms.values():
					for term in terms:
						options['terms'].append(term)

			except json.JSONDecodeError:
				pass

			try:
				p.start(
					verbosity=options['verbosity'],
					years=options.get('years'),
					terms=options.get('terms'),
					departments=options.get('departments'),
					textbooks=options['textbooks']
				)

				# Close up json files.
				p.wrap_up()

			except CourseParseError as e:
				logging.exception(e)
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				print(self.style.ERROR(error), file=self.stderr)
				tracker.see_error(error)
			except (JsonValidationError, JsonValidationWarning, IngestorWarning) as e:
				logging.exception(e)
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				print(self.style.ERROR(error), file=self.stderr)
				tracker.see_error(error)
			except Exception as e:
				logging.exception(e)
				dict_pp = lambda j: json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
				print(self.style.ERROR(traceback.format_exc()), file=self.stderr)
				print(self.style.ERROR(dict_pp(p.ingestor)), file=self.stderr)
				tracker.see_error(traceback.format_exc())
				tracker.see_error('INGESTOR DUMP\n' + dict_pp(p.ingestor))

			tracker.finish()

			# Reset some options for parse of next school.
			Command.reset_options_for_new_school(options)

		self.stdout.write(self.style.SUCCESS("Parsing Finished!"))

	def old_parser(self, do_parse, school):
		message = 'Starting {} parser for {}.\n'.format('courses', school)
		self.stdout.write(self.style.SUCCESS(message))
		try:
			do_parse()
		except Exception as e:
			self.stderr.write(traceback.format_exc())
