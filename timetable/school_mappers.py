"""This file contains all dicts which map a school to its associated object"""
import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from student.models import *


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
    'chapman': 5,
    'salisbury': 5,
}

VALID_SCHOOLS = [
  "uoft", 
  "jhu", 
  "umd", 
  "uo", 
  # "rutgers", 
  "queens",
  "vandy",
  "gw",
  "umich",
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
  "chapman",
  "salisbury",
]

school_code_to_name = {
  'jhu':       'Johns Hopkins University',
  'uoft':      'University of Toronto',
  'umd':       'University of Maryland',
  'rutgers':   'Rutgers University',
  'uo':        'University of Ottawa',
  'queens':    'Queens University',
  'vandy':     'Vanderbilt University',
  'gw':        'George Washington University',
  'umich':     'University of Michigan',
  'chapman':   'Chapman University',
  'salisbury': 'Salisbury University',
}

school_to_course_regex = {
  'jhu':       r'([A-Z]{2}\.\d{3}\.\d{3})',
  'uoft':      r'([A-Z]{3}[A-Z0-9]\d{2}[HY]\d)',
  'vandy':     r'([A-Z-&]{2,7}\s\d{4}[W]?)',
  'gw':        r'([A-Z]{2,5}\s\d{4}[W]?)',
  'umich':     r'([A-Z]{2,8}\s\d{3})',
  'chapman':   r'([A-Z]{2,4}\s\d{3})',
  'salisbury': r'([A-Z]{3,4} \d{2,3})',
}

_sem = lambda term, year: {'name': term, 'year': year}
school_to_semesters = {
  'jhu': [_sem('Fall', '2017'), _sem('Spring', '2017'), _sem('Fall', '2016')],
  'uoft': [_sem('Winter', '2017'), _sem('Fall', '2016')],
  'umd': [_sem('Spring', '2017'), _sem('Fall', '2016')],
  'rutgers': [_sem('Spring', '2017'), _sem('Fall', '2016')],
  'uo': [_sem('Spring', '2017'), _sem('Fall', '2016')],
  'queens': [_sem('Winter', '2017'), _sem('Fall', '2016')],
  'vandy': [_sem('Spring', '2017'), _sem('Fall', '2016')],
  'gw': [_sem('Spring', '2017'), _sem('Fall', '2016')],
  'umich': [_sem('Winter', '2017'), _sem('Fall', '2016')],
  'chapman': [_sem('Spring', '2017'), _sem('Fall', '2016')],
  'salisbury': [_sem('Spring', '2017'), _sem('Winter', '2017'), _sem('Fall', '2016'), _sem('Fall', '2017'), _sem('Summer', '2017'), _sem('Interterm', '2017')],
}

# Ensure DB has all semesters.
for school, semesters in school_to_semesters.items():
  for semester in semesters:
    Semester.objects.update_or_create(**semester)

# do the imports: assumes all parser follow the same naming conventions: 
# schoolname_parsertype where parsertype can be courses, evals, or textbooks
types = ['courses', 'evals', 'textbooks']
for school in VALID_SCHOOLS:
  for p_type in types:
    exec "from scripts.{0}.{0}_{1} import *".format(school, p_type)

# use lambdas to call constructor in a lazy fashion
course_parsers = {
  # 'jhu': lambda: HopkinsParser("Spring 2017").start(), # avoid calling constructor lazily
  'uoft': lambda: UofTParser().start(),
  # 'umd': parse_umd,
  # 'rutgers': parse_rutgers,
  'uo': parse_ottawa,
  'gw': lambda: GWParser().parse()
  # 'queens': lambda: QueensParser().parse_courses()
}

new_course_parsers = {
  'chapman':   lambda *args, **kwargs: ChapmanParser(**kwargs),
  'jhu':       lambda *args, **kwargs: HopkinsParser(**kwargs),
  'umich':     lambda *args, **kwargs: UmichParser(**kwargs),
  'queens':    lambda *args, **kwargs: QueensParser(**kwargs),
  'salisbury': lambda *args, **kwargs: SalisburyParser(**kwargs),
  'vandy':     lambda *args, **kwargs: VandyParser(**kwargs),
  'umd':       lambda *args, **kwargs: UMDParser(**kwargs),
}

new_textbook_parsers = {
  'chapman': lambda *args, **kwargs: ChapmanParser(*args, **kwargs),
  'gw': lambda *args, **kwargs: GWTextbookParser(**kwargs),
  'jhu': lambda *args, **kwargs: JHUTextbookParser(**kwargs),
  'umd': lambda *args, **kwargs: UMDTextbookParser(**kwargs)
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
