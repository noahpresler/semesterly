from django.core.management.base import BaseCommand, CommandError
from timetable.models import *
from timetable.school_mappers import VALID_SCHOOLS
from django.db.models import Q
from django.utils.encoding import smart_str
import datetime, logging, os, sys, cookielib, requests, time, re

class Command(BaseCommand):
  help = "Initiates sitemapper for all schools."
  def add_arguments(self, parser):
  	 	# optional argument to specify parser for specific school
  	 	parser.add_argument('school', nargs='?', default='')

  def success_print(self, message):
  	try:
		self.stdout.write(self.style.SUCCESS(message))
	except:
		self.stdout.write(message)

  def handle(self, *args, **options):
  	print os.path.dirname(os.path.realpath(__file__))
  	logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')
  	xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://semester.ly</loc></url>'
	xml_footer = "</urlset>"

	for school in VALID_SCHOOLS:
		xml += "<url><loc>https://" + school + "semester.ly</loc></url>\n"
		courses = Course.objects.filter(school=school)
		for course in courses:
			url = "https://" + school + ".semester.ly/c/" + course.code.replace(" ", "%20")
			xml += "<url><loc>" + url + "</loc></url>\n"

	xml = xml + xml_footer
	sitemap = open('static/sitemap.txt', 'w')
	sitemap.write(xml)
	sitemap.close()


	self.success_print("Finished!")