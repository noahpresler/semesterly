"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""
from __future__ import absolute_import, division, print_function

import traceback

from django.core.management.base import BaseCommand

from parsing.management.commands.arguments import digest_args
from parsing.library.validator import Validator
from parsing.library.digestor import Digestor
from parsing.library.internal_exceptions import JsonException, DigestionError
from parsing.library.tracker import Tracker
from parsing.library.viewer import LogFormatted
from searches.utils import Vectorizer


class Command(BaseCommand):
    help = 'Digestion driver'

    def add_arguments(self, parser):
        digest_args(parser)

    def handle(self, *args, **options):
        tracker = Tracker()
        tracker.add_viewer(LogFormatted(options['master_log']))
        tracker.set_cmd_options(options)
        tracker.mode = 'digesting'
        tracker.start()

        for data_type in options['types']:
            for school in options['schools']:
                self.run(tracker, school, data_type, options)

        tracker.end()

    def run(self, tracker, school, data_type, options):
        tracker.school = school

        tracker.mode = 'validating'

        try:
            Validator(
                options['config_file'].format(school=school,
                                              type=data_type),
                tracker=tracker
            ).validate_self_contained(
                options['data'].format(school=school, type=data_type),
                break_on_error=True,
                break_on_warning=options.get('break_on_warning'),
                output_error=options.get('output_error').format(
                    school=school,
                    type=data_type
                ),
                display_progress_bar=options['display_progress_bar']
            )
        except JsonException:
            return  # Skip digestion for this school.

        tracker.mode = 'digesting'

        try:
            Digestor(
                school,
                data=options['data'].format(school=school, type=data_type),
                output=options['output_diff'].format(school=school,
                                                     type=data_type),
                diff=options['diff'],
                load=options['load'],
                display_progress_bar=options['display_progress_bar'],
                tracker=tracker
            ).digest()

        except DigestionError as e:
            self.stderr.write(self.style.ERROR('FAILED: digestion'))
            self.stderr.write(str(e))
            tracker.see_error(str(e) + '\n' + traceback.format_exc())
        except Exception as e:
            self.stderr.write(self.style.ERROR('FAILED: digestion'))
            self.stderr.write(traceback.format_exc())
            tracker.see_error(traceback.format_exc())

        Vectorizer().vectorize()