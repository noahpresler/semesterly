import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import QueensCourse, QueensCourseOffering, Textbook, QueensLink

from qcumber_scraper.textbooks import main

for textbook in parse_textbooks():
