from django.core.management.base import BaseCommand, CommandParser, CommandError
from timetable.management.commands.args_parse import schoollist_argparser, digestor_argparser, validator_argparser, validate_switch_argparser

class Command(BaseCommand):
	def add_arguments(self, parser):
		digestor_argparser(parser)
		validate_switch_argparser(parser)
		validator_argparser(parser)

	def handle(self, *args, **options):
		pass
