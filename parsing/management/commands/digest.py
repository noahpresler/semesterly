# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import logging
import simplejson as json

from django.core.management.base import BaseCommand

from parsing.management.commands.arguments import digest_args
from parsing.library.validator import Validator, ValidationError, \
    ValidationWarning
from parsing.library.digestor import Digestor
from parsing.library.exceptions import PipelineException
from parsing.library.digestor import DigestionError
from parsing.library.tracker import Tracker
from parsing.library.viewer import StatProgressBar, ETAProgressBar, StatView


class Command(BaseCommand):
    """Django command to drive digestion in data pipeline.

    If no school is provided, starts digestion for all schools.

    Attributes:
        help (str): command help message.
    """

    help = 'Digestion driver'

    def add_arguments(self, parser):
        """Add arguments to command parser.

        Args:
            parser: Django argument parser.
        """
        digest_args(parser)

    def handle(self, *args, **options):
        """Logic of the command.

        Args:
            *args: Args of command.
            **options: Command options.
        """
        tracker = Tracker()
        self.stat_view = StatView()
        tracker.add_viewer(self.stat_view)
        tracker.mode = 'digesting'
        tracker.start()

        for data_type in options['types']:
            for school in options['schools']:
                self.run(tracker, school, data_type, options)

        tracker.end()

    def run(self, tracker, school, data_type, options):
        """Run the command."""
        tracker.school = school
        tracker.mode = 'validating'
        if options['display_progress_bar']:
            tracker.add_viewer(
                StatProgressBar('{valid}/{total}', statistics=self.stat_view),
                name='progressbar'
            )
        logger = logging.getLogger('parsing.schools.' + school)
        logger.debug('Digest command options:' + str(options))

        # Load config file to dictionary.
        if isinstance(options['config'], str):
            with open(options['config'].format(school=school,
                                               type=data_type), 'r') as file:
                options['config'] = json.load(file)

        try:
            Validator(
                options['config'],
                tracker=tracker
            ).validate_self_contained(
                options['data'].format(school=school, type=data_type),
                break_on_error=True,
                break_on_warning=options.get('break_on_warning'),
                display_progress_bar=options['display_progress_bar']
            )
        except (ValidationError, ValidationWarning, Exception):
            logging.exception('Failed validation before digestion')
            return  # Skip digestion for this school.

        if options['display_progress_bar']:
            tracker.remove_viewer('progressbar')
            tracker.add_viewer(ETAProgressBar(), name='progressbar')
        tracker.mode = 'digesting'

        with open(options['data'].format(school=school, type=data_type), 'r') as file:
            data = json.load(file)

        try:
            Digestor(
                school,
                meta=data['$meta'],
                tracker=tracker
            ).digest(data['$data'],
                     diff=options['diff'],
                     load=options['load'],
                     output=options['output_diff'].format(school=school,
                                                          type=data_type))

        except DigestionError:
            logging.exception('Failed digestion')
        except PipelineException:
            logging.expection('Failed digestion w/in pipeline')
        except Exception:
            logging.exception('Failed digestion with uncaught exception')

        logging.info('Digestion overview for ' + school + ': ' + str(self.stat_view.report()))
