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

import datetime, os, traceback
from timeit import default_timer as timer
from simplejson.scanner import JSONDecodeError

from django.core.management.base import BaseCommand, CommandParser, CommandError
from parsing.management.commands.args_parse import *
from parsing.library.validator import Validator
from parsing.library.digestor import Digestor
from parsing.library.internal_exceptions import JsonException, DigestionError
from parsing.library.tracker import Tracker, LogFormatted
from django.conf import settings

class Command(BaseCommand):
	def add_arguments(self, parser):
		schoollist_argparser(parser)
		digestor_argparser(parser)
		validate_switch_argparser(parser)
		validator_argparser(parser)
		progressbar_argparser(parser)
		masterlog_argparser(parser)
		# textbooks_argparser(parser)
		# TODO - replace with --type option

	def handle(self, *args, **options):
		# TODO - design better file path scheme.
		type_ = 'courses' if not options['textbooks'] else 'textbooks'

		for school in options['schools']:
			message = "Starting digestion for {}.\n".format(school)
			self.stdout.write(self.style.SUCCESS(message))
			directory = '{}/schools/{}'.format(settings.PARSING_DIR, school)

			# Default data directories.
			if not options.get('data'):
				options['data'] = '{}/data/{}.json'.format(directory, type_)
			if not options.get('log_stats'):
				options['log_stats'] = '{}/schools/logs/master.log'.format(settings.PARSING_DIR)

			if not os.path.isfile(options['data']):
				Command.reset_for_next_school(options)
				continue

			tracker = Tracker(school)
			tracker.add_viewer(LogFormatted(options['log_stats']))
			tracker.set_cmd_options(options)

			# Perform pre-digestion validation
			if options['validate']:
				if not options.get('config_file'):
					options['config_file'] = '{}/config.json'.format(directory)
				if not options.get('output_error'):
					options['output_error'] = '{}/logs/validate_{}_error.log'.format(directory, type_)

				try:
					print options['data']
					start_time = timer()
					vstat = Validator(options['config_file']).validate_self_contained(options['data'],
						break_on_error=True, # Do not allow digestion if error present
						break_on_warning=options['break_on_warning'],
						output_error=options.get('output_error'),
						display_progress_bar=options['display_progress_bar'])
					end_time = timer()
					self.stdout.write('\n')
				except (JsonException, JSONDecodeError) as e:
					self.stderr.write(self.style.ERROR('FAILED: validation.'))
					self.stderr.write(str(e) + '\n' + school + '\n')
					tracker.see_error(traceback.format_exc())
					Command.reset_for_next_school(options)
					continue # Skip digestion for this school.

			if not options.get('output_diff'):
				options['output_diff'] = '{}/logs/digest_{}_diff.log.json'.format(directory, type_)

			tracker.start()

			try:
				Digestor(school,
					data=options['data'],
					output=options['output_diff'],
					diff=options['diff'],
					load=options['load'],
					display_progress_bar=options['display_progress_bar'],
					tracker=tracker,
				).digest()

			except DigestionError as e:
				self.stderr.write(self.style.ERROR('FAILED: digestion'))
				self.stderr.write(str(e))
				tracker.see_error(str(e) + '\n' + traceback.format_exc())
			except Exception as e:
				self.stderr.write(self.style.ERROR('FAILED: digestion'))
				self.stderr.write(traceback.format_exc())
				tracker.see_error(traceback.format_exc())

			tracker.end()
			Command.reset_for_next_school(options)

		self.stdout.write(self.style.SUCCESS("Digestion Finished!"))

	@staticmethod
	def reset_for_next_school(options):
		options['data'] = None
		options['config_file'] = None
		options['output_error'] = None
