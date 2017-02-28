from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.management.commands.args_parse import *
from scripts.parser_library.Validator import Validator
from scripts.parser_library.Digestor import Digestor
from scripts.parser_library.internal_exceptions import JsonException, DigestionError

class Command(BaseCommand):
	def add_arguments(self, parser):
		digestor_argparser(parser)
		validate_switch_argparser(parser)
		validator_argparser(parser)
		progressbar_argparser(parser)

	def handle(self, *args, **options):
		message = "Starting digestion for {}.\n".format(options['school'])
		self.stdout.write(self.style.SUCCESS(message))
		directory = 'scripts/' + options['school']

		# default data
		if not options.get('data'):
			options['data'] = '{}/data/courses.json'.format(directory)

		# Perform pre-digestion validation
		if options['validate']:
			if not options.get('config_file'):
				options['config_file'] = '{}/config.json'.format(directory)
			if not options.get('output_error'):
				options['output_error'] = '{}/logs/validate_error.log.json'.format(directory)

			try:
				Validator(options['config_file']).validate_self_contained(options['data'],
					break_on_error=True, # Do not allow digestion if error present
					break_on_warning=options['break_on_warning'],
					output_error=options.get('output_error'),
					hide_progress_bar=options['hide_progress_bar'])
				self.stdout.write('\n')
			except JsonException as e:
				self.stderr.write(self.style.ERROR('FAILED: validation.'))
				self.stderr.write(str(e) + '\n')
				return # Stop here. Do not allow digestion if error present.

		if not options.get('output_diff'):
			options['output_diff'] = directory + '/logs/digest_diff.log.json'

		try:
			Digestor(options['school'],
				data=options['data'],
				output=options['output_diff'],
				diff=options['diff'],
				load=options['load']
			).digest()
		except DigestionError as e:
			self.stderr.write(self.style.ERROR('FAILED: digestion'))
			self.stderr.write(str(e))

		self.stdout.write(self.style.SUCCESS("Digestion Finished!"))
