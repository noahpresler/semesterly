from django.core.management.base import BaseCommand, CommandError
from timetable.models import Updates
from timetable.school_mappers import textbook_parsers
from amazonproduct import API
from amazonproduct.errors import InvalidParameterValue
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
from django.db.models import Q
from django.utils.encoding import smart_str
import datetime, logging, os, sys, cookielib, requests, time, re

class Command(BaseCommand):
  help = "Initiates textbook parsers for specified schools. If no school is provided, starts textbook parsers for all schools."
  def add_arguments(self, parser):
  	 	# optional argument to specify parser for specific school
  	 	parser.add_argument('school', nargs='?', default='')

  def success_print(self, message):
  	try:
		self.stdout.write(self.style.SUCCESS(message))
	except:
		self.stdout.write(message)

  def handle(self, *args, **options):
  	logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

  	schools_with_tb_parsers=textbook_parsers.keys()

  	schools = schools_with_tb_parsers
  	if options['school']:
  		if options['school'] in schools_with_tb_parsers:
  			schools = [options['school']]
  		else:
			self.stderr.write(self.style.ERROR("Invalid school provided. Valid options are: " + str(schools_with_tb_parsers)))
			exit(1)


	for school, do_parse in textbook_parsers.iteritems():
  		if school in schools:
			try:

				message = "parser for %s.\n" % (school)
				self.success_print("Starting " + message)
				logging.exception(message)
				do_parse()
				
				# set the last_updated information for the school's textbooks
				update_object, created = Updates.objects.update_or_create(
					school=school,
					update_field="Textbook",
					defaults={'last_updated': datetime.datetime.now()}
				)
				self.success_print("Finished " + message + "\n")

			except Exception as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(error)
				self.stderr.write(self.style.ERROR(error))

	self.success_print("Finished!")
