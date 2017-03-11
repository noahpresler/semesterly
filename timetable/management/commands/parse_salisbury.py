import os
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
	def handle(self, *args, **options):
		with open(os.environ['SEMESTERLY_HOME'] + '/hello.txt', 'w') as f:
			f.write('from manage.py')