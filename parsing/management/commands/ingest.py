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
from parsing.management.commands.arguments import ingest_args
from parsing.library.exceptions import PipelineException
from parsing.library.tracker import Tracker
from parsing.library.viewer import StatProgressBar, StatView


class Command(BaseCommand):
    """Django command to drive ingestion in data pipeline.

    If no school is provided, starts ingestor for all schools.

    Attributes:
        help (str): command help message.
    """

    help = 'Ingestion driver.'

    def add_arguments(self, parser):
        """Add arguments to command parser.

        Args:
            parser: Django argument parser.
        """
        ingest_args(parser)

    def handle(self, *args, **options):
        """Logic of the command.

        Args:
            *args: Args of command.
            **options: Command options.
        """
        tracker = Tracker()
        tracker.mode = 'ingesting'
        self.stat_view = StatView()
        tracker.add_viewer(self.stat_view)
        if options['display_progress_bar']:
            tracker.add_viewer(StatProgressBar('{valid}/{total}',
                                               statistics=self.stat_view))
        tracker.start()

        for parser_type in options['types']:
            for school in options['schools']:
                tracker.school = school

                try:
                    parsing = __import__(
                        'parsing.schools.{school}.{parser_type}'.format(
                            school=school,
                            parser_type=parser_type
                        )
                    )
                    parser = eval(
                        'parsing.schools.{school}.{parser_type}.Parser'.format(
                            school=school,
                            parser_type=parser_type
                        )
                    )
                    self.run(parser,
                             tracker,
                             options,
                             parser_type,
                             school)
                except ImportError:
                    logging.exception('Invalid parser')
                    continue

        tracker.end()

    def run(self, parser, tracker, options, parser_type, school):
        """Run the command.

        Args:
            parser (parsing.library.base_parser.BaseParser)
            tracker (parsing.library.tracker.Tracker)
            options (dict): Command line options for arg parser.
            parser_type (str): {'courses', 'evals', 'textbooks'}
            school (str): School to parse.
        """
        # Load config file to dictionary.
        if isinstance(options['config'], str):
            with open(options['config'].format(school=school,
                                               type=parser_type), 'r') as file:
                options['config'] = json.load(file)

        logger = logging.getLogger(parser.__module__ + '.' + parser.__name__)
        logger.debug('Ingest command options:' + str(options))
        try:
            p = parser(
                config=options['config'],
                output_path=options['output'].format(school=school, type=parser_type),
                # output_error_path=options['output_error'].format(
                #     school=school,
                #     type=parser_type
                # ),
                break_on_error=options['break_on_error'],
                break_on_warning=options['break_on_warning'],
                display_progress_bar=options['display_progress_bar'],
                validate=options['validate'],
                tracker=tracker
            )

            p.start(
                verbosity=options['verbosity'],
                textbooks=parser_type == 'textbook',
                departments_filter=options.get('departments'),
                years_and_terms_filter=Command._resolve_years_and_terms(
                    options
                )
            )

            p.end()

        except PipelineException:
            logger.exception('Ingestion failed for ' + school + ' ' + parser_type)
            try:
                logger.debug('Ingestor dump for ' + school, p.ingestor)
            except UnboundLocalError:
                pass
        except Exception:
            logger.exception('Ingestion failed for ' + school + ' ' + parser_type)

        logger.info('Ingestion overview for ' + school + ': ' + str(self.stat_view.report()))

    @staticmethod
    def _resolve_years_and_terms(options):
        if options.get('years_and_terms') is not None:
            return options['years_and_terms']

        # Construct years and terms dictionary
        years_and_terms = {}
        for year in options['years']:
            year = years_and_terms.setdefault(year, [])
            for term in options['terms']:
                year.append(term)
        return years_and_terms
