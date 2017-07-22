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

from django.core.management.base import BaseCommand, CommandParser, CommandError
from scripts.library.validator import Validator
from timetable.management.commands.args_parse import *
from scripts.library.internal_exceptions import *

class Command(BaseCommand):
	def add_arguments(self, parser):
		validate_argparser(parser)
		validator_argparser(parser)
		progressbar_argparser(parser)

	def handle(self, *args, **options):
		message = "Starting validation for {}.\n".format(options['school'])
		self.stdout.write(self.style.SUCCESS(message))

		school = options['school']
		directory = 'scripts/' + school
		if not options.get('data'):
			options['data'] = '{}/data/courses.json'.format(directory)
		if not options.get('config_file'):
			options['config_file'] = directory + '/config.json'
		if not options.get('output_error'):
			options['output_error'] = directory + '/logs/validate_error.log.json'

		try:
			Validator(options['config_file']).validate_self_contained(options['data'],
				break_on_error=options.get('break_on_error'), # Do not allow digestion if error present
				break_on_warning=options.get('break_on_warning'),
				output_error=options.get('output_error'),
				display_progress_bar=options['display_progress_bar'])
		except JsonException as e:
			self.stdout.write(self.style.ERROR('FAILED VALIDATION.'))
			self.stderr.write(str(e))
			tracker.see_error('FAILED VALIDATION for {}\n'.format(school) + str(e))
		except Exception as e:
			self.stdout.write(self.style.ERROR('FAILED VALIDATION.'))
			self.stderr.write(str(e))
			tracker.see_error('FAILED VALIDATION for {}\n'.format(school) + str(e))

		self.stdout.write(self.style.SUCCESS("Validation Finished!"))
		# TODO - add success to master logger using tracker