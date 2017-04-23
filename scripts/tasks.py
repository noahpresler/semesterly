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
    run_every=(crontab(hour=1, minute=29)),
    name="task_parse",
    ignore_result=True
)
def task_parse(schools=None):
    """Celery parse task."""
    for school in VALID_SCHOOLS:
    	task_parse_school.delay(school)

@task()
def task_parse_school(school):
    """Celery parse task."""
    management.call_command('ingest', school, term=TERM, year=YEAR, hide_progress_bar=True)
    management.call_command('digest', school, hide_progress_bar=True)
    print('Parsed {}'.format(school))
