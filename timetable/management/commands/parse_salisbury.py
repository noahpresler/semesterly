import os
from django.core.management.base import BaseCommand, CommandError
from scripts.salisbury.salisbury_courses import go

class Command(BaseCommand):
	def handle(self, *args, **options):
		go()
