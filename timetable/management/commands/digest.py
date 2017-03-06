import datetime, os, traceback
from timeit import default_timer as timer
from simplejson.scanner import JSONDecodeError

from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.management.commands.args_parse import *
from scripts.parser_library.Validator import Validator
from scripts.parser_library.Digestor import Digestor
from scripts.parser_library.internal_exceptions import JsonException, DigestionError

# FIXME -- horrible design should make upper base class
from timetable.management.commands.parse import Command as PCommand

class Command(BaseCommand):
	def add_arguments(self, parser):
		# Provide list of schools to parse; none implies all
		schoollist_argparser(parser)

		digestor_argparser(parser)
		validate_switch_argparser(parser)
		validator_argparser(parser)
		progressbar_argparser(parser)
		masterlog_argparser(parser)

	def handle(self, *args, **options):
		timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")
		stats = []

		type_ = 'courses'

		for school in options['schools']:
			message = "Starting digestion for {}.\n".format(school)
			self.stdout.write(self.style.SUCCESS(message))
			directory = 'scripts/' + school

			# default data
			if not options.get('data'):
				options['data'] = '{}/data/{}.json'.format(directory, type_)
			if not options.get('log_stats'):
				options['log_stats'] = 'scripts/logs/master.log'

			if not os.path.isfile(options['data']):
				options['data'] = None
				continue

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
						hide_progress_bar=options['hide_progress_bar'])
					end_time = timer()
					self.stdout.write('\n')
				except (JsonException, JSONDecodeError) as e:
					self.stderr.write(self.style.ERROR('FAILED: validation.'))
					self.stderr.write(str(e) + '\n')
					stats.append('FAILED: validation. ' + school + '\n' + traceback.format_exc())
					options['data'] = None
					options['config_file'] = None
					options['output_error'] = None
					continue

				stats.append('({}) [Elapsed Time: {:.2f}s] {}'.format(school, end_time - start_time, vstat))

			if not options.get('output_diff'):
				options['output_diff'] = '{}/logs/digest_{}_diff.log.json'.format(directory, type_)

			try:
				d = Digestor(school,
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

			# Reset data file to reload from next school.
			options['data'] = None
			options['config_file'] = None
			options['output_error'] = None

		self.stdout.write(self.style.SUCCESS("Digestion Finished!"))
		PCommand.log_stats(options['log_stats'], stats=stats, options=options, timestamp=timestamp)
