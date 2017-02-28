from django.core.management.base import BaseCommand, CommandParser, CommandError
from scripts.parser_library.Validator import Validator
from timetable.management.commands.args_parse import *
from scripts.parser_library.internal_exceptions import *

class Command(BaseCommand):
	def add_arguments(self, parser):
		validate_argparser(parser)
		validator_argparser(parser)
		progressbar_argparser(parser)

	def handle(self, *args, **options):
		message = "Starting validation for {}.\n".format(options['school'])
		self.stdout.write(self.style.SUCCESS(message))

		directory = 'scripts/' + options['school']
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
				hide_progress_bar=options['hide_progress_bar'])
		except JsonException as e:
			self.stdout.write(self.style.ERROR('FAILED.'))
			self.stderr.write(str(e))

		self.stdout.write(self.style.SUCCESS("Validation Finished!"))
