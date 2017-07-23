"""
Data Pipeline - Ingestion Driver.

@org      Semesterly
@author   Michael N. Miller
@date     07/17/2017
"""

from __future__ import absolute_import, division, print_function

import logging
import simplejson as json
import traceback

from django.core.management.base import BaseCommand
from django.conf import settings
from timetable.school_mappers import course_parsers, textbook_parsers, \
    new_course_parsers, new_textbook_parsers, new_eval_parsers, eval_parsers
from parsing.management.commands.args_parse import schoollist_argparser, \
    ingestor_argparser, validator_argparser
from parsing.library.internal_exceptions import CourseParseError, \
    JsonValidationError, JsonValidationWarning, IngestorWarning
from parsing.library.tracker import Tracker
from parsing.library.viewer import LogFormatted, ProgressBar


class Command(BaseCommand):
    """Django command to drive ingestion.

    If no school is provided, starts ingestor for all schools.

    Attributes:
        help (str): django command help message
    """

    help = 'Initiates ingestor for specified schools. If no school ' + \
           'is provided, starts ingestor for all schools.'
    dummy = None  # Temporarily here to stop Sublime from being annoying.

    def add_arguments(self, parser):
        """Summary.

        Args:
            parser: Django argument parser
        """
        # NOTE: already specified:
        #       --no-color
        #       --verbosity

        # Provide list of schools to parse; none implies all
        schoollist_argparser(parser)

        # Options for ingestor
        ingestor_argparser(parser)

        # Options for validation
        validator_argparser(parser)

    @staticmethod
    def _reset_options_for_new_school(options):
        options['config_file'] = None
        options['output'] = None
        options['output_error_filepath'] = None

    def handle(self, *args, **options):
        """The actual logic of the ingest command.

        Args:
            *args: command args
            **options: command options
        """
        logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

        # NOTE: TODO - hacky until school_mappers is deprecated
        new_map = {
            'textbook': new_textbook_parsers,
            'course': new_course_parsers,
            'eval': new_eval_parsers,
        }
        old_map = {
            'textbook': textbook_parsers,
            'course': course_parsers,
            'eval': eval_parsers,
        }

        for school in options['schools']:

            parsers = new_map[options['type']]
            if school not in parsers:
                do_parse = old_map[options['type']][school]
                self.old_parser(do_parse, school)
                continue

            parser = parsers[school]
            message = 'Ingesting {} {}.\n'.format(school, options['type'])
            self.stdout.write(self.style.SUCCESS(message))
            logging.exception(message)  # TODO - WHY IS THIS an exception?

            directory = '{}/schools/{}'.format(settings.PARSING_DIR, school)
            if options.get('config_file') is None:
                options['config_file'] = '{}/config.json'.format(directory)
            if options.get('output') is None:
                options['output'] = '{}/data/{}.json'.format(directory,
                                                             options['type'])
            if options.get('output_error') is None:
                options['output_error'] = '{}/logs/error_{}.log'.format(
                    directory,
                    options['type']
                )
            if options.get('master_log') is None:
                options['log_stats'] = settings.PARSING_DIR + '/logs/master.log'

            try:
                years_and_terms = json.loads(
                    str(options.get('years_and_terms'))
                )
                # NOTE: str applied to handle NoneType TypeError
            except json.JSONDecodeError:
                years_and_terms = None

            tracker = Tracker(school)
            tracker.set_cmd_options(options)
            tracker.add_viewer(LogFormatted(options['log_stats']))
            tracker.mode = 'ingesting'

            if options['display_progress_bar']:
                def formatter(stats):
                    return '{}/{}'.format(stats['valid'], stats['total'])
                tracker.add_viewer(ProgressBar(school, formatter))

            p = parser(school,
                       config_path=options['config_file'],
                       output_path=options['output'],
                       output_error_path=options['output_error'],
                       break_on_error=options['break_on_error'],
                       break_on_warning=options['break_on_warning'],
                       display_progress_bar=options['display_progress_bar'],
                       validate=options['validate'],
                       tracker=tracker)
            tracker.start()

            # Convert years to ints.
            if 'years' in options and options.get('years'):
                options['years'] = map(int, options['years'])

            try:
                p.start(
                    verbosity=options['verbosity'],
                    years=options.get('years'),
                    terms=options.get('terms'),
                    years_and_terms=years_and_terms,
                    departments=options.get('departments'),
                    textbooks=options['type'] == 'textbook'
                )

                # Close up json files.
                p.end()

            except CourseParseError as e:
                logging.exception(e)
                error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
                print(self.style.ERROR(error), file=self.stderr)
                tracker.see_error(error)
            except (JsonValidationError, JsonValidationWarning, IngestorWarning) as e:
                logging.exception(e)
                error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
                print(self.style.ERROR(error), file=self.stderr)
                tracker.see_error(error)
            except Exception as e:
                logging.exception(e)

                def dict_pp(j):
                    return json.dumps(j,
                                      sort_keys=True,
                                      indent=2,
                                      separators=(',', ': '))
                print(self.style.ERROR(traceback.format_exc()),
                      file=self.stderr)
                print(self.style.ERROR(dict_pp(p.ingestor)),
                      file=self.stderr)
                tracker.see_error(traceback.format_exc())
                tracker.see_error('INGESTOR DUMP\n' + dict_pp(p.ingestor))

            tracker.end()

            # Reset some options for parse of next school.
            Command._reset_options_for_new_school(options)

        self.stdout.write(self.style.SUCCESS("Parsing Finished!"))

    def old_parser(self, do_parse, school):
        """Run older parser that sidesteps datapipeline.

        Args:
            do_parse (lambda): Parsing function to run.
            school (str): The school name.
        """
        message = 'Starting {} parser for {}.\n'.format('courses', school)
        self.stdout.write(self.style.SUCCESS(message))
        try:
            do_parse()
        except Exception:
            self.stderr.write(traceback.format_exc())
