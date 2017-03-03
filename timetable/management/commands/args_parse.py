# TODO - https://github.com/kislyuk/argcomplete

import os, argparse
from timetable.school_mappers import course_parsers, new_course_parsers, new_textbook_parsers

def schoollist_argparser(parser):
	# Handles nargs='*' with strict choices and set to all schools if empty
	class school_verifier_action(argparse.Action):
		VALID_SCHOOLS = set(new_course_parsers.keys()) | set(new_textbook_parsers.keys()) | set(course_parsers.keys())
		def __call__(self, parser, namespace, values, option_string=None):
			for value in values:
				if value not in school_verifier_action.VALID_SCHOOLS:
					raise parser.error('invalid school: {0!r} (choose from [{1}])'
						.format(value, ', '.join(school_verifier_action.VALID_SCHOOLS)))
			if values:
				# NOTE: set(values) to uniqueify list of schools
				setattr(namespace, self.dest, list(set(values)))
			else:
				# set list of schools to all schools that are parseable
				setattr(namespace, self.dest, school_verifier_action.VALID_SCHOOLS)

	# optional argument to specify parser for specific school
	parser.add_argument('schools', type=str, nargs='*', action=school_verifier_action,
		help='(default: all parseable schools)')
	# NOTE: list of schools cannot support single config file arg (see: single_school_action)

def masterlog_argparser(parser):
	parser.add_argument('--log-stats', type=str, action=writable_file_action)

def validate_switch_argparser(parser):
	validation = parser.add_mutually_exclusive_group()
	validation.add_argument('--validate', dest='validate', action='store_true',
		help='validate parser output (default)')
	validation.add_argument('--no-validate', dest='validate', action='store_false',
		help='do not validate parser output')
	validation.set_defaults(validate=True)

def progressbar_argparser(parser):
	parser.add_argument('--hide-progress-bar', dest='hide_progress_bar', action='store_true', default=False,
		help='flag to hide progress bar (default is visible)')

def parser_argparser(parser):
	parser.add_argument('--term-and-year', nargs=2, type=str,
		help='parse for term and year - two args') 
	parser.add_argument('--department', nargs='+',
		help='parse specific departments by code')
	parser.add_argument('--course',
		help='parse specific course code (note: unstable if invalid course code)')
	parser.add_argument('-o', '--output', action=writable_file_action,
		help='(default:  scripts/[school]/data/courses.json)')
	textbooks = parser.add_mutually_exclusive_group()
	textbooks.add_argument('--textbooks', dest='textbooks', action='store_true',
		help='parse textbooks')
	textbooks.add_argument('--no-textbooks', dest='textbooks', action='store_false',
		help='don\'t parse textbooks')
	textbooks.set_defaults(textbooks=False)

	validate_switch_argparser(parser)
	progressbar_argparser(parser)

def validate_argparser(parser):
	parser.add_argument('school', type=str)
	parser.add_argument('--data', action=readable_file_action,
		help='default(scripts/[school]/data/courses.json)')

def validator_argparser(parser):
	# enforce that non-default config can only be applied to single school
	class single_school_action(argparse.Action):
		def __call__(self, parser, namespace, values, option_string=None):
			if 'schools' in namespace and len(namespace.schools) > 1:
				raise parser.error('non-default config can only apply to single school')
	class config_file_action(argparse.Action):
		def __call__(self, parser, namespace, values, option_string=None):
			single_school_action('','').__call__(parser, namespace, values, option_string)
			writable_file_action(option_string, self.dest).__call__(parser, namespace, values, option_string)

	parser.add_argument('--output-error', help='(default: /scripts/[school]/logs/error_<ptype>.log)', action=writable_file_action)
	parser.add_argument('--config-file', action=config_file_action,
		help='load config file from this path (default: [school]/config.json)')
	break_error = parser.add_mutually_exclusive_group()
	break_error.add_argument('--break-on-error', dest='break_on_error', action='store_true', help='(default)')
	break_error.add_argument('--no-break-on-error', dest='break_on_error', action='store_false')
	break_error.set_defaults(break_on_error=True)
	break_warning = parser.add_mutually_exclusive_group()
	break_warning.add_argument('--break-on-warning', dest='break_on_warning', action='store_true')
	break_warning.add_argument('--no-break-on-warning', dest='break_on_warning', action='store_false', 
		help='(default)')
	break_warning.set_defaults(break_on_warning=False)
	duplicate = parser.add_mutually_exclusive_group()
	duplicate.add_argument('--skip-shallow-duplicates', dest='skip_shallow_duplicates', action='store_true',
		help='(default) hide duplicate course/section ingestions')
	duplicate.add_argument('--no-skip-shallow-duplicates', dest='skip_shallow_duplicates', action='store_false')
	duplicate.set_defaults(skip_shallow_duplicates=True)

def digestor_argparser(parser):
	parser.add_argument('school', type=str)
	parser.add_argument('--data', action=readable_file_action,
		help='default: (scripts/[school]/data/courses.json)')

	class set_false_error_on_no_diff_no_load_action(argparse.Action):
		def __call__(self, parser, namespace, values, option_string=None):
			attr_name = option_string.strip('-').strip('no').strip('-').replace('-', '_')
			setattr(namespace, attr_name, False)
			other_attr_name = 'diff' if attr_name == 'load' else 'load'
			if not getattr(namespace, attr_name) and not getattr(namespace, other_attr_name):
				raise parser.error('--no-diff and --no-load performs no action')

	parser.add_argument('--output-diff', type=str, action=writable_file_action)
	diff = parser.add_mutually_exclusive_group()
	diff.add_argument('--diff', dest='diff', action='store_true', 
		help='output diff between input and django db')
	diff.add_argument('--no-diff', dest='diff', nargs=0,
		action=set_false_error_on_no_diff_no_load_action)
	diff.set_defaults(diff=True)
	load = parser.add_mutually_exclusive_group()
	load.add_argument('--load', dest='load', action='store_true',
		help='load django db models with info from json')
	load.add_argument('--no-load', dest='load', nargs=0,
		action=set_false_error_on_no_diff_no_load_action)
	load.set_defaults(load=True)

# Argparse hook to check for writable file within directory
class writable_file_action(argparse.Action):
	def __call__(self, parser, namespace, values, option_string=None):
		if not values:
			return
		prospective_file = values
		prospective_dir = os.path.dirname(os.path.abspath(prospective_file))
		if not os.path.isdir(prospective_dir):
			raise parser.error('writable_file: `%s` is not a valid file path' % (prospective_file) )
		if os.access(prospective_dir, os.W_OK):
			setattr(namespace, self.dest, prospective_file)
		else:
			raise parser.error('writable_file: `%s` is not a writable file' % (prospective_file) )
class readable_file_action(argparse.Action):
	def __call__(self, parser, namespace, values, option_string=None):
		if not values:
			return
		prospective_file = values
		prospective_dir = os.path.dirname(os.path.abspath(prospective_file))
		if not os.path.isdir(prospective_dir):
			raise parser.error('readable_file: `%s` is not a valid file path' % (prospective_file) )
		if os.access(prospective_dir, os.R_OK):
			setattr(namespace, self.dest, prospective_file)
		else:
			raise parser.error('readable_file: `%s` is not a writable file' % (prospective_file) )

# Setup Object for creating valid Django subparsers
# REF: http://stackoverflow.com/questions/36706220/is-it-possible-to-create-subparsers-in-a-django-management-command
# class SubParser(CommandParser):
# 	def __init__(self, **kwargs):
# 		super(SubParser, self).__init__(cmd, **kwargs)

# FIXME --no-validate and validator conflict without resolutoin
# validator_sub_parser = parser.add_subparsers(title="validator", parser_class=SubParser, help='options when validating parser output')
# validator = validator_sub_parser.add_parser('validator', help='run python manage.py parse [school] validator --help for more')
# validator_argparser(validator)
