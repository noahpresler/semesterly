import os

from amazonproduct import API
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from qcumber_scraper.textbooks import main
from scripts.amazon_helpers import *


api = API(locale='us')

def parse_queens_textbooks():
  for tb in main(True):
    if 'isbn_13' not in tb:
      continue
    isbn = tb['isbn_13']
    required = tb.get('required', False) or False

    tb_info = get_amazon_fields(isbn, api)
    if tb_info and tb_info['Title'] != 'Cannot Be Found':
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


