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

from __future__ import absolute_import, division, print_function

import logging

from django.core.management.base import BaseCommand

from parsing.management.commands.arguments import digest_args
from parsing.library.vectorizer import Vectorizer
from parsing.library.exceptions import PipelineException
from parsing.library.vectorizer import VectorizationError


class Command(BaseCommand):
    """Django command to drive vectorization in data pipeline.

    If no school is provided, starts vectorization for all schools.

    Attributes:
        help (str): command help message.
    """

    help = 'Vectorization driver'

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

        for school in options['schools']:
            self.run(school, options)

    def run(self, school, options):
        """Run the command."""
        logger = logging.getLogger('vectorizing.schools.' + school)
        logger.debug('Vectorize command options:' + str(options))

        try:
            Vectorizer(school).vectorize()

        except VectorizationError:
            logging.exception('Failed vectorization')
        except PipelineException:
            logging.expection('Failed vectorization w/in pipeline')
        except Exception:
            logging.exception('Failed vectorization with uncaught exception')

        logging.info('vectorization overview for ' + school)

        # TODO - move to periodic tasks
