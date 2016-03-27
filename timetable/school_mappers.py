"""This file contains all dicts which map a school to its associated object"""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from StringIO import StringIO
import sys

school_to_models = {
    'jhu': (HopkinsCourse, HopkinsCourseOffering),
    'uoft': (Course, CourseOffering),
    'umd': (UmdCourse, UmdCourseOffering),
    'rutgers': (RutgersCourse, RutgersCourseOffering),
    #'uo': (OttawaCourse, OttawaCourseOffering)
}

# the smallest number of minutes needed to describe start/end times
# e.g. uoft classes only start on the hour or half hour, so granularity is 30min
school_to_granularity = {
    'jhu': 5,
    'uoft': 30,
    'umd': 5,
    'rutgers': 5
}


# suppress output for parser class constructors by redirecting stdout
# sys.stdout = StringIO()
# stdout = sys.stdout

# do the imports: assumes all parser follow the same naming conventions: 
# schoolname_parsertype where parsertype can be courses, evals, or textbooks
types = ['courses', 'evals', 'textbooks']
for school in school_to_models:
  for p_type in types:
    exec "from scripts.{0}.{0}_{1} import *".format(school, p_type)

course_parsers = {
  'jhu': lambda: HopkinsParser().start(), # avoid calling constructor lazily
  'uoft': UofTParser().start,
  'umd': parse_umd,
  'rutgers': parse_rutgers
}

eval_parsers = {
  'jhu': lambda: HopkinsEvalParser().parse_evals(),
  'uoft': lambda: None,
  'umd': umdReview().parse_reviews,
  'rutgers': lambda: None
}

textbook_parsers = {
  'jhu': lambda: HopkinsTextbookFinder().parse_classes(),
  'uoft': parse_uoft_textbooks,
  'umd': lambda: None,
  'rutgers': lambda: None
}

# sys.stdout = stdout