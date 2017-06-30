from __future__ import absolute_import, division, print_function

import sys

from celery.decorators import periodic_task, task
from celery.task.schedules import crontab
from celery.utils.log import get_task_logger

from django.core import management

import simplejson as json

from timetable.school_mappers import \
    FULL_ACADEMIC_YEAR_REGISTRATION_SCHOOLS, SINGLE_ACCESS_SCHOOLS, \
    VALID_SCHOOLS, school_to_active_semesters

logger = get_task_logger(__name__)


@periodic_task(
    run_every=(crontab(hour=00, minute=00)),
    name="task_parse_recent",
    ignore_result=True
)
def task_parse_recent(schools=None, textbooks=False):
    """Celery parse task."""
    if schools is None:
        schools = VALID_SCHOOLS
    schools = set(schools)
    for school in set(school_to_active_semesters) & schools:
        years = [sorted(school_to_active_semesters[school])[-1]]
        if school in FULL_ACADEMIC_YEAR_REGISTRATION_SCHOOLS:
            if len(school_to_active_semesters[school]) > 2:
                years.append(sorted(school_to_active_semesters[school])[-2])
            if school in SINGLE_ACCESS_SCHOOLS:
                years_and_terms = {
                    year: school_to_active_semesters[school][year][0]
                    for year in years
                }
                task_parse_school.delay(
                    school,
                    years_and_terms
                )
            continue

        for year in years:
            term = school_to_active_semesters[school][year][0]
            task_parse_school.delay(school, {year: [term]},
                                    textbooks=textbooks)


# @periodic_task(
#     run_every=(crontab(hour=00, minute=00)),
#     name="task_parse_active",
#     ignore_result=True
# )
def task_parse_active(schools=None, textbooks=False):
    if schools is None:
        schools = VALID_SCHOOLS
    schools = set(schools)
    for school in set(school_to_active_semesters) & schools:
        if school in SINGLE_ACCESS_SCHOOLS:
            task_parse_school.delay(
                school,
                school_to_active_semesters[school]
            )
            continue

        for year, terms in school_to_active_semesters[school].items():
            for term in terms:
                task_parse_school.delay(school, {year: [term]},
                                        textbooks=textbooks)


@periodic_task(
    run_every=(crontab(day_of_week='sun', hour=12, minute=00)),
    name="task_parse_textbooks",
    ignore_result=True
)
def task_parse_textbooks(schools=None):
    return task_parse_recent(schools, textbooks=True)


@task()
def task_parse_school(school, years_and_terms, textbooks=False):
    def flatten(d):
        if isinstance(d, dict):
            return '-'.join("%s%s" % (k, flatten(v)) for (k, v) in d.items())
        if isinstance(d, list):
            return ''.join("%s" % flatten(v) for v in d)
        return d

    filename = 'scripts/{}/data/courses_{}.json'.format(
        school,
        flatten(years_and_terms)
    )

    print(years_and_terms, file=sys.stderr)

    management.call_command('ingest', school,
                            years_and_terms=json.dumps(years_and_terms),
                            textbooks=textbooks,
                            hide_progress_bar=True,
                            verbosity=0,
                            output=filename)
    management.call_command('digest', school,
                            textbooks=textbooks,
                            hide_progress_bar=True,
                            verbosity=0,
                            data=filename)
    print('Parsed {} {}'.format(school, years_and_terms))
