"""This file contains all dicts which map a school to its associated object"""
from uoft_parser import UofTParser
from hopkins_parser import HopkinsParser
from umd_parser import UMDParser
from timetable.models import *

school_to_models = {
    'jhu': (HopkinsCourse, HopkinsCourseOffering),
    'uoft': (Course, CourseOffering),
    'umd': (UmdCourse, UmdCourseOffering),
    'rutgers': (RutgersCourse, RutgersCourseOffering),
    'uo': (OttawaCourse, OttawaCourseOffering)
}

school_to_parser = {
	'jhu': HopkinsParser,
    'uoft': UofTParser,
    'umd': UMDParser,
    'rutgers': None,
    'uo': None
}

# the smallest number of minutes needed to describe start/end times
# e.g. uoft classes only start on the hour or half hour, so granularity is 30min
school_to_granularity = {
    'jhu': 5,
    'uoft': 30,
    'umd': 5,
    'rutgers': 5
}

# assumes all parser follow the same naming conventions: [schoolname]_[parsertype]
# where parsertype can be courses, evals, or textbooks
for school in school_to_models:
  for p_type in ['courses', 'evals', 'textbooks']:
    exec "from scripts.{0}.{0}_{1} import *".format(school, p_type)

school_to_course_parser = {
  'jhu': HopkinsParser().start,
  'uoft': UofTParser().start,
  'umd': UMDParser().start,
  'rutgers': parse_rutgers
}

school_to_eval_parser = {
  'jhu': HopkinsEvalParser().parse_evals,
  'uoft': lambda: None,
  'umd': umdReview().parse_reviews,
  'rutgers': lambda: None
}

school_to_textbook_parser = {
  'jhu': HopkinsTextbookFinder().parse_classes,
  'uoft': parse_uoft_textbooks,
  'umd': lambda: None,
  'rutgers': lambda: None
}