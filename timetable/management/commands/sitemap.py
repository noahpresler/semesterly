# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from django.core.management.base import BaseCommand, CommandError
from timetable.models import *
from parsing.schools.active import ACTIVE_SCHOOLS

from django.db.models import Q
from django.utils.encoding import smart_str
import datetime, logging, os, sys, http.cookiejar, requests, time, re

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
  	print(os.path.dirname(os.path.realpath(__file__)))
  	update_time = str(datetime.datetime.today()).split()[0]
  	logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')
  	xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  	xml += '<url><loc>https://semester.ly</loc><lastmod>' + update_time + '</lastmod><changefreq>daily</changefreq><priority>0.1</priority></url>\n'
	xml_footer = "</urlset>"

	for school in ACTIVE_SCHOOLS:
		xml += "<url><loc>https://" + school + ".semester.ly</loc><lastmod>" + update_time + "</lastmod><changefreq>daily</changefreq><priority>0.1</priority></url>\n"
		xml += "<url><loc>https://" + school + ".semester.ly/courses</loc><lastmod>" + update_time + "</lastmod><changefreq>daily</changefreq><priority>0.1</priority></url>\n"
		courses = Course.objects.filter(school=school)
		for course in courses:
			url = "https://" + school + ".semester.ly/c/" + course.code.replace(" ", "%20")
			xml += "<url><loc>" + url + "</loc><lastmod>" + update_time + "</lastmod><changefreq>daily</changefreq><priority>0.1</priority></url>\n"

	xml = xml + xml_footer
	sitemap = open('static/sitemap.txt', 'w')
	sitemap.write(xml)
	sitemap.close()

	self.success_print("Finished!")
