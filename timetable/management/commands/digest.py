import datetime
from timeit import default_timer as timer

from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.management.commands.args_parse import *
from scripts.parser_library.Validator import Validator
from scripts.parser_library.Digestor import Digestor
from scripts.parser_library.internal_exceptions import JsonException, DigestionError

# FIXME -- horrible design should make upper base class
from timetable.management.commands.parse import Command as PCommand

class Command(BaseCommand):
	def add_arguments(self, parser):
		digestor_argparser(parser)
		validate_switch_argparser(parser)
		validator_argparser(parser)
		progressbar_argparser(parser)
		masterlog_argparser(parser)

	def handle(self, *args, **options):
		timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")
		school = options['school']
		message = "Starting digestion for {}.\n".format(school)
		self.stdout.write(self.style.SUCCESS(message))
		directory = 'scripts/' + options['school']

		# default data
		if not options.get('data'):
			options['data'] = '{}/data/courses.json'.format(directory)
		if not options.get('master_log'):
			options['log_stats'] = 'scripts/logs/master.log'

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
				raise CommandError('Digestion validation failed.') # Stop here. Do not allow digestion if error present.

		if not options.get('output_diff'):
			options['output_diff'] = directory + '/logs/digest_diff.log.json'

		stats = []

		try:
			d = Digestor(options['school'],
				data=options['data'],
				output=options['output_diff'],
				diff=options['diff'],
				load=options['load']
			)

			start_time = timer()
			d.digest()
			end_time = timer()
			stats.append('({}) [Elapsed Time: {:.2f}s] {}'.format(school, end_time - start_time, d.get_stats()))

		except DigestionError as e:
			self.stderr.write(self.style.ERROR('FAILED: digestion'))
			self.stderr.write(str(e))

		self.stdout.write(self.style.SUCCESS("Digestion Finished!"))
		PCommand.log_stats(options['log_stats'], stats=stats, options=options, timestamp=timestamp)
