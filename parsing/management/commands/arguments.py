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

import os
import argparse
import simplejson as json

from django.conf import settings

from parsing.schools.active import ACTIVE_SCHOOLS

# TODO - https://github.com/kislyuk/argcomplete

# NOTE: already specified:
#       --no-color
#       --verbosity

SCHOOLS_DIR = settings.PARSING_MODULE + '/schools'


def ingest_args(parser):
    """Ingest command arguments.

    Args:
        parser (argparser.Parser): Django argument parser.
    """
    _progress_bar_arg(parser)
    _school_list_arg(parser)
    _parser_type_arg(parser)
    parser.add_argument('-o',
                        '--output',
                        action=WritableFileAction,
                        help='default: %(default)s',
                        default=SCHOOLS_DIR + '/{school}/data/{type}.json')
    parser.add_argument('--terms', nargs='+', type=str, default=[r'\w*'])
    parser.add_argument('--years', nargs='+', type=int, default=[r'\d{4}'])
    parser.add_argument('--years-and-terms', type=str, dest='years_and_terms',
                        action=LoadToJsonAction,
                        help='json formatted (year, term) dictionary. If provided, will override `terms` and `years` values.')
    parser.add_argument('--departments', nargs='+', type=str)
    _validate_switch_arg(parser)
    _validator_args(parser)
    _master_log_arg(parser)


def validate_args(parser):
    """Validate command arguments.

    Args:
        parser (argparser.Parser): Django argument parser.
    """
    _progress_bar_arg(parser)
    _school_list_arg(parser)
    _parser_type_arg(parser)
    _data_arg(parser)
    _validator_args(parser)
    _master_log_arg(parser)


def digest_args(parser):
    """Digest command arguments.

    Args:
        parser (argparser.Parser): Django argument parser.
    """
    class SetFalseErrorOnNoDiffNoLoadAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            setattr(namespace, self.dest, False)
            other_attr = 'diff' if self.dest == 'load' else 'load'
            if (not getattr(namespace, self.dest) and
                    not getattr(namespace, other_attr)):
                raise parser.error('--no-diff and --no-load does no action')

    class RestrictNoValidateAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            attr = self.dest
            if namespace.load:
                parser.error('cannot load database without validation')
            setattr(namespace, attr, False)

    _progress_bar_arg(parser)
    _school_list_arg(parser)
    _parser_type_arg(parser)
    _data_arg(parser)

    diff = parser.add_mutually_exclusive_group()
    diff.add_argument('--diff',
                      dest='diff',
                      action='store_true',
                      help='output diff between input and django db')
    diff.add_argument('--no-diff',
                      dest='diff',
                      nargs=0,
                      action=SetFalseErrorOnNoDiffNoLoadAction)
    diff.set_defaults(diff=True)

    parser.add_argument(
        '--output-diff',
        type=str,
        action=compose_actions(SingleSchoolAction, WritableFileAction),
        default=SCHOOLS_DIR + '/{school}/logs/diff_{type}.json',
        help='default: %(default)s)'
    )

    load = parser.add_mutually_exclusive_group()
    load.add_argument('--load',
                      dest='load',
                      action='store_true',
                      help='load django db models with info from json')
    load.add_argument('--no-load',
                      dest='load',
                      nargs=0,
                      action=SetFalseErrorOnNoDiffNoLoadAction)
    load.set_defaults(load=True)

    _validator_args(parser)

    parser.add_argument('--no-validate',
                        dest='validate',
                        nargs=0,
                        action=RestrictNoValidateAction)

    _master_log_arg(parser)


def _school_list_arg(parser):
    class SchoolVerifierAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            """Verify school list, set to all valid schools if none listed."""
            for value in values:
                if value in ACTIVE_SCHOOLS:
                    continue
                raise parser.error(
                    'invalid school: {0!r} (choose from [{1}])'.format(
                        value,
                        ', '.join(ACTIVE_SCHOOLS)
                    )
                )
            if values:
                setattr(namespace, self.dest, list(set(values)))
            else:
                setattr(namespace,
                        self.dest,
                        list(ACTIVE_SCHOOLS))

    parser.add_argument('schools',
                        type=str,
                        nargs='*',
                        action=SchoolVerifierAction,
                        help='default: parsing.schools.active.ACTIVE_SCHOOLS')


def _validate_switch_arg(parser):
    parser.add_argument('--no-validate',
                        dest='validate',
                        action='store_false')


def _master_log_arg(parser):
    parser.add_argument('--master-log',
                        type=str,
                        action=WritableFileAction,
                        default=settings.PARSING_MODULE + '/logs/master.log',
                        help='default: %(default)s')


def _parser_type_arg(parser):
    parser.add_argument('--types',
                        default=['courses'],
                        nargs='+',
                        choices=['courses', 'textbooks', 'evals'],
                        help='default: %(default)s')


def _progress_bar_arg(parser):
    # NOTE: name and dest are logical inverses
    parser.add_argument('--no-display-progress-bar',
                        dest='display_progress_bar',
                        action='store_false')


def _validator_args(parser):
    parser.add_argument(
        '--config',
        action=compose_actions(SingleSchoolAction,
                               ReadableFileAction,
                               LoadFileToJsonAction),
        help='default: %(default)s',
        default=SCHOOLS_DIR + '/{school}/config.json'
    )

    # parser.add_argument(
    #     '--output-error',
    #     action=compose_actions(SingleSchoolAction, WritableFileAction),
    #     help='default: %(default)s',
    #     default=SCHOOLS_DIR + '/{school}/logs/error_{type}.log'
    # )

    parser.add_argument('--no-break-on-error',
                        dest='break_on_error',
                        action='store_false')

    break_on_warning = parser.add_mutually_exclusive_group()
    break_on_warning.add_argument('--no-break-on-warning',
                                  dest='break_on_warning',
                                  action='store_false')
    break_on_warning.add_argument('--break-on-warning',
                                  dest='break_on_warning',
                                  action='store_true')
    break_on_warning.set_defaults(break_on_warning=False)


def _data_arg(parser):
    parser.add_argument(
        '--data',
        action=compose_actions(SingleSchoolAction, ReadableFileAction),
        default=SCHOOLS_DIR + '/{school}/data/{type}.json',
        help='default: %(default)s'
    )


class WritableFileAction(argparse.Action):
    """Argparse hook to check for writable file within directory."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Writable file action callable.

        Raises:
            parser.error: The file is not writable.
        """
        if not values:
            return
        prospective_file = values
        prospective_dir = os.path.dirname(os.path.abspath(prospective_file))
        if not os.path.isdir(prospective_dir):
            raise parser.error(
                '{} is not a valid file path'.format(prospective_file)
            )
        if os.access(prospective_dir, os.W_OK):
            setattr(namespace, self.dest, prospective_file)
        else:
            raise parser.error(
                '{} is not a writable file'.format(prospective_file)
            )


class ReadableFileAction(argparse.Action):
    """Argparse hook to check for readable file within directory."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Readble file action callable.

        Raises:
            parser.error: The file is not readable.
        """
        if not values:
            return
        prospective_file = values
        prospective_dir = os.path.dirname(os.path.abspath(prospective_file))
        if not os.path.isdir(prospective_dir):
            raise parser.error(
                '{} is not a valid file path'.format(prospective_file)
            )
        if os.access(prospective_file, os.R_OK):
            setattr(namespace, self.dest, prospective_file)
            return
        raise parser.error('{} isnt a readable file'.format(prospective_file))


class SingleSchoolAction(argparse.Action):
    """Argparse hook to enforce only single school in school list."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Single school action callable.

        Raises:
            parser.error: non-default config for mutliple schools.
        """
        if hasattr(namespace, 'schools') and len(namespace.schools) > 1:
            raise parser.error('non-default config invalid for many schools')


class LoadToJsonAction(argparse.Action):
    """Argparse hook to load json input into Python dictionary."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Load to JSON action callable.

        Raises:
            parser.error: invalid JSON.
        """
        try:
            setattr(namespace, self.dest, json.loads(values))
        except json.scanner.JSONDecodeError:
            parser.error(option_string + ' invalid JSON')


class LoadFileToJsonAction(argparse.Action):
    """Argparse hook to read JSON file and load into Python dictionary."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Load file to JSON Action.

        Raises:
            parser.error: invalid JSON.
        """
        with open(values, 'r') as file:
            data = file.read()
        try:
            setattr(namespace, self.dest, json.loads(data))
        except json.scanner.JSONDecodeError:
            parser.error('invalid JSON in {}'.format(values))


def compose_actions(*actions):
    """Compose many argparse actions into one callable action.

    Args:
        *actions: The actions to compose.

    Returns:
        argparse.Action: Composed action.
    """
    class ComposableAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            for action in actions:
                action(option_string, self.dest).__call__(parser,
                                                          namespace,
                                                          values,
                                                          option_string)
    return ComposableAction
