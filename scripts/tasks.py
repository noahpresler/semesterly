# @what     Parsing tasks
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     6/30/17

"""Parsing tasks that will be performed on periodic schedule."""
from __future__ import absolute_import, division, print_function

import simplejson as json

from celery.decorators import periodic_task, task
from celery.task.schedules import crontab
from celery.utils.log import get_task_logger
from django.core import management

from timetable.school_mappers import \
    FULL_ACADEMIC_YEAR_REGISTRATION_SCHOOLS, SINGLE_ACCESS_SCHOOLS, \
    VALID_SCHOOLS, school_to_semesters

logger = get_task_logger(__name__)


@periodic_task(
    run_every=(crontab(hour=00, minute=00)),
    name="task_parse_current_registration_period",
    ignore_result=True
)
def task_parse_current_registration_period(schools=None, textbooks=False):
    """Parse semesters in current registration period."""
    schools = set(schools or VALID_SCHOOLS)
    for school in set(school_to_semesters) & schools:
        # Grab the most recent year.
        years = [school_to_semesters[school][-1]]

        # Handle case where registration is for full academic year
        if school in FULL_ACADEMIC_YEAR_REGISTRATION_SCHOOLS:
            if len(school_to_semesters[school]) > 2:
                years.append(school_to_semesters[school][-2])

            # Group all semesters into single parsing call for schools that
            #  cannot support parallel parsing.
            if school in SINGLE_ACCESS_SCHOOLS:
                years_and_terms = {
                    year: school_to_semesters[school][year][0]
                    for year in years
                }
                task_parse_school.delay(
                    school,
                    years_and_terms
                )
            continue

        # Create individual parsing tasks.
        for year in years:
            term = school_to_semesters[school][year][0]
            task_parse_school.delay(school, {year: [term]},
                                    textbooks=textbooks)


@task()
def task_parse_active(schools=None, textbooks=False):
    """Parse all semesters displayed to users (i.e. active semesters)."""
    schools = set(schools or VALID_SCHOOLS)
    for school in set(school_to_semesters) & schools:
        if school in SINGLE_ACCESS_SCHOOLS:
            task_parse_school.delay(
                school,
                school_to_semesters[school]
            )
            continue

        for year, terms in school_to_semesters[school].items():
            for term in terms:
                task_parse_school.delay(school, {year: [term]},
                                        textbooks=textbooks)


@periodic_task(
    run_every=(crontab(day_of_week='sun', hour=12, minute=00)),
    name="task_parse_textbooks",
    ignore_result=True
)
def task_parse_textbooks(schools=None, all=False):
    """Parse textbooks for morst recent academic period.

    Note that in some instances parsers parse textbooks
    and courses at the same time.
    """
    if all:
        return task_parse_active(schools, textbooks=True)
    return task_parse_current_registration_period(schools, textbooks=True)


@task()
def task_parse_school(school, years_and_terms, textbooks=False):
    """Call the django management commands to start parse."""
    filename = 'scripts/{}/data/courses_{}.json'.format(
        school,
        '-'.join('{}{}'.format(
            year, ''.join(terms)) for year, terms in years_and_terms.items()
        )
    )

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
