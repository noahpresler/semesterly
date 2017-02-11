from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.management.commands.args_parse import schoollist_argparser, digestor_argparser, validator_argparser, validate_switch_argparser
from scripts.parser_library.Validator import Validator
from scripts.parser_library.Digestor import Digestor
from scripts.parser_library.internal_exceptions import DigestionError

class Command(BaseCommand):
	def add_arguments(self, parser):
		digestor_argparser(parser)
		validate_switch_argparser(parser)
		validator_argparser(parser)

	def handle(self, *args, **options):
		directory = 'scripts/' + options['school']

		# Perform pre-digestion validation
		if options['validate']:
			if not options.get('config_file'):
				options['config_file'] = directory + '/config.json'
			if not options.get('output_error'):
				options['output_error'] = directory + '/logs/validate_error.log.json'
			Validator(options['config_file']).validate_self_contained(options['data'],
				break_on_error=True, # Do not allow digestion if error present
				break_on_warning=options.get('break_on_warning'),
				output_error=options.get('output_error'))

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
			print 'Digestion ERROR CAUGHT'
			print e
