"""This file contains all dicts which map a school to its associated object"""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from student.models import *
import sys

# the smallest block size (in minutes) needed to describe start/end times
# e.g. uoft classes only start on the hour or half hour, so granularity is 30min
school_to_granularity = {
    'jhu': 5,
    'uoft': 30,
    'umd': 5,
    'rutgers': 5,
    'uo': 5,
    'queens': 5,
    'vandy': 5,
    'umich': 5,
    'chapman': 5
}

VALID_SCHOOLS = [
  "uoft", 
  "jhu", 
  "umd", 
  "uo", 
  "rutgers", 
  "queens",
  "vandy",
  "umich",
  "chapman"
]

AM_PM_SCHOOLS = [
  "jhu",
  "umd",
  "rutgers",
  "vandy",
  "umich",
  "chapman"
]

school_code_to_name = {
  'jhu': 'Johns Hopkins University',
  'uoft': 'University of Toronto',
  'umd': 'University of Maryland',
  'rutgers': 'Rutgers University',
  'uo': 'University of Ottawa',
  'queens': 'Queens University',
  'vandy': 'Vanderbilt University',
  'umich': 'University of Michigan',
  'chapman': 'Chapman University'
}

# do the imports: assumes all parser follow the same naming conventions: 
# schoolname_parsertype where parsertype can be courses, evals, or textbooks
types = ['courses', 'evals', 'textbooks']
for school in VALID_SCHOOLS:
  for p_type in types:
    exec "from scripts.{0}.{0}_{1} import *".format(school, p_type)

course_parsers = {
  'jhu': lambda: HopkinsParser("Spring 2017").start(), # avoid calling constructor lazily
  'uoft': lambda: UofTParser().start(),
  'umd': parse_umd,
  # 'rutgers': parse_rutgers,
  'uo': parse_ottawa
  # 'queens': lambda: QueensParser().parse_courses()
}

eval_parsers = {
  'jhu': lambda: HopkinsEvalParser().parse_evals(),
  'uoft': lambda: None,
  'umd': lambda: umdReview().parse_reviews,
  'rutgers': lambda: None,
  'uo': lambda: None,
  'queens': lambda: None
}
textbook_parsers = {
  'jhu': lambda: HopkinsTextbookFinder().parse_classes(),
  'uoft': parse_uoft_textbooks,
  'umd': lambda: None,
  'rutgers': lambda: None,
  'uo': lambda: None,
  'queens': parse_queens_textbooks
}
sitemappers = {
  'jhu': lambda: HopkinsTextbookFinder().parse_classes(),
  'uoft': parse_uoft_textbooks,
  'umd': lambda: None,
  'rutgers': lambda: None,
  'uo': lambda: None,
  'queens': parse_queens_textbooks
}
