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
    'gw':5,
    'umich': 5,
    'umich2': 5,
    'chapman': 5,
    'salisbury': 5,
}

VALID_SCHOOLS = [
  "uoft", 
  "jhu", 
  "umd", 
  "uo", 
  "rutgers", 
  "queens",
  "vandy",
  "gw",
  "umich",
  "umich2",
  "chapman",
  "salisbury",
]

AM_PM_SCHOOLS = [
  "jhu",
  "umd",
  "rutgers",
  "vandy",
  "gw",
  "umich",
  "umich2",
  "chapman",
  "salisbury",
]

school_code_to_name = {
  'jhu': 'Johns Hopkins University',
  'uoft': 'University of Toronto',
  'umd': 'University of Maryland',
  'rutgers': 'Rutgers University',
  'uo': 'University of Ottawa',
  'queens': 'Queens University',
  'vandy': 'Vanderbilt University',
  'gw':'George Washington University',
  'umich': 'University of Michigan',
  'umich2': 'University of Michigan 2!',
  'chapman': 'Chapman University',
  'salisbury': 'Salisbury University',
}

school_to_course_regex = {
  'jhu': '([A-Z]{2}\.\d{3}\.\d{3})',
  'uoft': '([A-Z]{3}[A-Z0-9]\d{2}[HY]\d)',
  'vandy': '([A-Z-&]{2,7}\s\d{4}[W]?)',
  'gw': '([A-Z]{2,5}\s\d{4}[W]?)',
  'umich': '([A-Z]{2,8}\s\d{3})',
  'chapman': '([A-Z]{2,4}\s\d{3})',
  'salisbury': '([A-Z]{3,4} \\d{2,3})',
}

school_to_semesters = {
  'jhu': ['Spring', 'Fall'],
  'uoft': ['Winter', 'Fall'],
  'umd': ['Spring', 'Fall'],
  'rutgers': ['Spring', 'Fall'],
  'uo': ['Spring', 'Fall'],
  'queens': ['Winter', 'Fall'],
  'vandy': ['Spring', 'Fall'],
  'gw': ['Spring', 'Fall'],
  'umich': ['Winter', 'Fall'],
  'umich2': ['Winter', 'Fall'],
  'chapman': ['Spring', 'Fall'],
}

# do the imports: assumes all parser follow the same naming conventions: 
# schoolname_parsertype where parsertype can be courses, evals, or textbooks
types = ['courses', 'evals', 'textbooks']
for school in VALID_SCHOOLS:
  for p_type in types:
    exec "from scripts.{0}.{0}_{1} import *".format(school, p_type)

# use lambdas to call constructor in a lazy fashion
course_parsers = {
  'jhu': lambda: HopkinsParser("Fall 2017").start(),
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
