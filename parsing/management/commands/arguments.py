"""Filler."""
from __future__ import absolute_import, division, print_function

import os
import argparse
import simplejson as json

from django.conf import settings

from parsing.schools.active import VALID_SCHOOLS

# TODO - https://github.com/kislyuk/argcomplete

# NOTE: already specified:
#       --no-color
#       --verbosity

SCHOOLS_DIR = settings.PARSING_DIR + '/schools'


def ingest_args(parser):
    """Ingest command arguments.

    Args:
        parser (argparser.Parser): Django argument parser.
    """
    class LoadToJsonAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            try:
                setattr(parser, self.dest, json.loads(values))
            except json.JSONDecodeError:
                parser.error('invalid JSON')

    _progress_bar_arg(parser)
    _school_list_arg(parser)
    _parser_type_arg(parser)
    parser.add_argument('-o',
                        '--output',
                        action=WritableFileAction,
                        help='default: %(default)s',
                        default=SCHOOLS_DIR + '/{school}/data/courses.json')
    parser.add_argument('--terms', nargs='+', type=str)
    parser.add_argument('--years', nargs='+', type=int)
    parser.add_argument('--years-and-terms', type=str, dest='years_and_terms',
                        action=LoadToJsonAction,
                        help='json formatted (year, term) dictionary')
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
            attr = self.dest
            setattr(namespace, attr, False)
            other_attr = 'diff' if attr == 'load' else 'load'
            if (not getattr(namespace, attr) and
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
        action=SingleSchoolWritableFileAction,
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
                if value in VALID_SCHOOLS:
                    continue
                raise parser.error(
                    'invalid school: {0!r} (choose from [{1}])'.format(
                        value,
                        ', '.join(VALID_SCHOOLS)
                    )
                )
            if values:
                setattr(namespace, self.dest, list(set(values)))
            else:
                setattr(namespace,
                        self.dest,
                        list(VALID_SCHOOLS))

    parser.add_argument('schools',
                        type=str,
                        nargs='*',
                        action=SchoolVerifierAction,
                        help='default: parsing.schools.active.VALID_SCHOOLS')


def _validate_switch_arg(parser):
    parser.add_argument('--no-validate',
                        dest='validate',
                        action='store_false')


def _master_log_arg(parser):
    parser.add_argument('--master-log',
                        type=str,
                        action=WritableFileAction,
                        default=settings.PARSING_DIR + '/logs/master.log',
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
        '--config-file',
        action=SingleSchoolWritableFileAction,
        help='default: %(default)s',
        default=SCHOOLS_DIR + '/{school}/config.json'
    )

    parser.add_argument(
        '--output-error',
        action=SingleSchoolWritableFileAction,
        help='default: %(default)s',
        default=SCHOOLS_DIR + '/{school}/logs/error_{type}.log'
    )

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
        action=SingleSchoolReadableFileAction,
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
        if os.access(prospective_dir, os.R_OK):
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


class SingleSchoolWritableFileAction(argparse.Action):
    """Enforce that non-default config can only be applied to single school."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Single school and writable file action callable."""
        SingleSchoolAction('', '').__call__(parser,
                                            namespace,
                                            values,
                                            option_string)
        WritableFileAction(option_string, self.dest).__call__(parser,
                                                              namespace,
                                                              values,
                                                              option_string)


class SingleSchoolReadableFileAction(argparse.Action):
    """Enforce single school action and readable file action."""

    def __call__(self, parser, namespace, values, option_string=None):
        """Single schools and readable file action callable."""
        SingleSchoolAction('', '').__call__(parser,
                                            namespace,
                                            values,
                                            option_string)
        ReadableFileAction(option_string, self.dest).__call__(parser,
                                                              namespace,
                                                              values,
                                                              option_string)
