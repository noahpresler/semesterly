"""Filler."""

from __future__ import absolute_import, division, print_function

import logging
import simplejson as json
import traceback

from django.core.management.base import BaseCommand
from timetable.school_mappers import parsers, course_parsers, \
    textbook_parsers, eval_parsers
from parsing.management.commands.arguments import ingest_args
from parsing.library.internal_exceptions import CourseParseError, \
    JsonValidationError, JsonValidationWarning, IngestorWarning
from parsing.library.exceptions import PipelineError, PipelineWarning
from parsing.library.tracker import Tracker
from parsing.library.viewer import LogFormatted, ProgressBar


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
        tracker.set_cmd_options(options)
        tracker.add_viewer(LogFormatted(options['master_log']))
        tracker.mode = 'ingesting'
        if options['display_progress_bar']:
            tracker.add_viewer(ProgressBar('{valid}/{total}'))
        tracker.start()

        for data_type in options['types']:
            for school in options['schools']:
                tracker.school = school

                # TODO - remove after deprecation
                if school not in parsers[data_type]:
                    old_map = {
                        'textbooks': textbook_parsers,
                        'courses': course_parsers,
                        'evals': eval_parsers,
                    }
                    self.old_parser(old_map[data_type][school], school)
                    continue
                # END - remove after deprecation

                self.run(parsers[data_type][school],
                         tracker,
                         options,
                         data_type,
                         school)
        tracker.end()

    def run(self, parser, tracker, options, data_type, school):
        """Run the parser.

        Args:
            parser (parsing.library.base_parser.BaseParser)
            tracker (parsing.library.tracker.Tracker)
            options (dict): Command line options for arg parser.
            data_type (str): {'courses', 'evals', 'textbooks'}
            school (str): School to parse.
        """
        try:
            p = parser(
                config_path=options['config_file'].format(
                    school=school,
                    type=data_type
                ),
                output_path=options['output'].format(school=school),
                output_error_path=options['output_error'].format(
                    school=school,
                    type=data_type
                ),
                break_on_error=options['break_on_error'],
                break_on_warning=options['break_on_warning'],
                display_progress_bar=options['display_progress_bar'],
                validate=options['validate'],
                tracker=tracker
            )

            p.start(
                verbosity=options['verbosity'],
                years=options.get('years'),
                terms=options.get('terms'),
                years_and_terms=options.get('years_and_terms'),
                departments=options.get('departments'),
                textbooks=data_type == 'textbook'
            )

            p.end()

        except PipelineError as e:
            pass  # TODO
        except PipelineWarning as e:
            pass  # TODO
        except CourseParseError as e:
            logging.exception(e)
            error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
            print(self.style.ERROR(error), file=self.stderr)
            tracker.see_error(error)
        except (JsonValidationError,
                JsonValidationWarning, IngestorWarning) as e:
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
            print(self.style.ERROR(dict_pp(parser.ingestor)),
                  file=self.stderr)
            tracker.see_error(traceback.format_exc())
            tracker.see_error('INGESTOR DUMP\n' + dict_pp(parser.ingestor))

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
