from __future__ import print_function, absolute_import, unicode_literals

from celery.task.schedules import crontab
from celery.decorators import periodic_task, task
from celery.utils.log import get_task_logger

from timetable.school_mappers import VALID_SCHOOLS
from django.core import management

logger = get_task_logger(__name__)

TERM = ['Fall']
YEAR = ['2017']


@periodic_task(
    run_every=(crontab(hour=00, minute=00)),
    name="task_parse",
    ignore_result=True
)
def task_parse(schools=None):
    """Celery parse task."""
    for school in VALID_SCHOOLS:
        task_parse_school.delay(school)


@periodic_task(
    run_every=(crontab(day_of_week='sun', hour=12, minute=00)),
    name="task_parse_textbooks",
    ignore_result=True
)
def task_parse_textbooks(schools=None):
    """Celery parse task."""
    for school in VALID_SCHOOLS:
        task_parse_school.delay(school, textbooks=True)


@task()
def task_parse_school(school, textbooks=False):
    """Celery parse task."""
    management.call_command('ingest', school,
                            term=TERM, year=YEAR, textbooks=textbooks,
                            hide_progress_bar=True, verbosity=0)
    management.call_command('digest', school, textbooks=textbooks,
                            hide_progress_bar=True, verbosity=0)
    print('Parsed {}'.format(school))
