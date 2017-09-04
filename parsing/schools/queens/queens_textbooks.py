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

import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from qcumber_scraper.textbooks import main
from parsing.common.textbooks.amazon_textbooks import amazon_textbook_fields
from timetable.models import Textbook


def parse_queens_textbooks():
  for tb in main(True):
    if 'isbn_13' not in tb:
      continue
    isbn = tb['isbn_13']
    required = tb.get('required', False) or False

    tb_info = amazon_textbook_fields(isbn)
    if tb_info and tb_info['title'] != 'Cannot Be Found':
      tb_data = {
        'detail_url': tb_info['DetailPageURL'],
        'image_url': tb_info["ImageURL"],
        'author': tb_info["Author"],
        'title': tb_info["Title"]
      }
      tb_obj, created = Textbook.objects.update_or_create(isbn=isbn,
                                                          defaults=tb_data)
      if created:
        print "New textbook: {0} by {1}".format(tb_data['title'], tb_data['author'])
      courses = [QueensCourse.objects.get(code=c) for c in tb.get('courses', [])]
      for course in courses:
        offerings = QueensCourseOffering.objects.filter(course=course)
        for offering in offerings:
          # TODO: use update_or_create??
          if offering.textbooks.filter(isbn=isbn):
            continue
          new_link = QueensLink(courseoffering=offering, textbook=tb_obj,
                                is_required=bool(required))
          new_link.save()
          print "--Saved to section {0}".format(offering.section_code)

if __name__ == '__main__':
  parse_queens_textbooks()


