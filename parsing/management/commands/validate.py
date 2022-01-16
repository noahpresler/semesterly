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
from parsing.library.validator import Validator
from parsing.management.commands.arguments import validate_args
from parsing.library.tracker import Tracker
from parsing.library.viewer import StatProgressBar


class Command(BaseCommand):
    """Django command to drive self-contained validation in data pipeline.

    If no school is provided, starts validator for all schools.

    Attributes:
        help (str): command help message.
    """

    help = 'Validation driver.'

    def add_arguments(self, parser):
        """Add arguments to command parser.

        Args:
            parser: Django argument parser.
        """
        validate_args(parser)

    def handle(self, *args, **options):
        """Logic of the command.

        Args:
            *args: Args of command.
            **options: Command options.
        """
        tracker = Tracker()
        tracker.mode = 'validating'
        if options['display_progress_bar']:
            tracker.add_viewer(StatProgressBar('{valid}/{total}'))
        tracker.start()

        for parser_type in options['types']:
            for school in options['schools']:
                self.run(options, school, parser_type, tracker)

    def run(self, options, school, parser_type, tracker):
        """Run the validator.

        Args:
            options (dict): Command line options for arg parser.
            school (str): School to parse.
            parser_type (str): {'courses', 'evals', 'textbooks'}
        """
        tracker.school = school
        logger = logging.getLogger('parsing.schools.' + school)
        logger.debug('Command options:', options)

        # Load config file to dictionary.
        if isinstance(options['config'], str):
            with open(options['config'].format(school=school,
                                               type=parser_type), 'r') as file:
                options['config'] = json.load(file)

        try:
            Validator(
                options['config'],
                tracker=tracker
            ).validate_self_contained(
                options['data'].format(school=school, type=parser_type),
                break_on_error=options.get('break_on_error'),
                break_on_warning=options.get('break_on_warning'),
                display_progress_bar=options['display_progress_bar']
            )
        except Exception:
            logger.exception('Validation failed for ' + school)
