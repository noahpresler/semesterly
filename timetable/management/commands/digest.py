from django.core.management.base import BaseCommand, CommandParser, CommandError

class Command(BaseCommand):
	def add_arguments(self, parser):
		digestor_argparser(parser)

	def handle(self, *args, **options):
