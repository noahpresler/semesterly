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

from urllib.request import urlopen
import requests
import re
import datetime
import sys
import json
import time
from string import capwords
from bs4 import BeautifulSoup

# import django
# from timetable.models import *


# django.setup()

class InvalidSemesterException(Exception):
  pass


if __name__ == '__main__':
  semester = 'F'
  if semester not in ['F', 'S']:
    raise InvalidSemesterException("Semester must be either F or S")
  # look up term numbers here: http://www.courses.as.pitt.edu
  term = '2171' if semester == 'F' else '2164'

  subjects_url = "http://www.courses.as.pitt.edu/subj-index.html"

  # find subject codes by looking for upper case sequences in page text
  print("retrieving subject codes")
  html = urlopen(subjects_url).read()
  soup = BeautifulSoup(html)
  text = soup.findAll(text=True)
  subjects = re.findall(r'[A-Z]{2,}', ' '.join(text[1:]))

