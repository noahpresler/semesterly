from __future__ import print_function, absolute_import, unicode_literals

from celery.task.schedules import crontab
from celery.decorators import periodic_task
from celery.utils.log import get_task_logger

from timetable.school_mappers import VALID_SCHOOLS
from django.core import management

logger = get_task_logger(__name__)

TERM = 'Fall'
YEAR = '2017'


@periodic_task(
    run_every=(crontab(hour=13, minute=35)),
    name="task_parse",
    ignore_result=True
)
def task_parse():
    """Celery parse task."""
    for school in ['jhu']:
        management.call_command('ingest', school, term=[TERM], year=[YEAR])
        management.call_command('digest', school)
        print('Parsed {}'.format(school))
