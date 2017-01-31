from django.core.management.base import BaseCommand, CommandParser, CommandError
import os
import django
from timetable.models import Updates
from timetable.school_mappers import course_parsers
import datetime, logging, os, sys, argparse

# class ParseParser:
# 	def __init__(self):
# 		pass

def parser_argparser(parser, subparser_class=None):
	parser.add_argument('--term-and-year', nargs=2, type=str,
		help='parse for term and year as two args') 
	parser.add_argument('--department',
		help='parse specific department by code')
	parser.add_argument('-o', '--output', default='stdout', 
		help='(default: stdout)')
	parser.add_argument('--hide-progress-bar', dest='hide_progress_bar', action='store_true', default=False,
		help='flag to hide progress bar (default is visible)')

	textbooks = parser.add_mutually_exclusive_group()
	textbooks.add_argument('--textbooks', dest='textbooks', action='store_true',
		help='parse textbooks')
	textbooks.add_argument('--no-textbooks', dest='textbooks', action='store_false',
		help='don\'t parse textbooks')
	textbooks.set_defaults(textbooks=False)

	validation = parser.add_mutually_exclusive_group()
	validation.add_argument('--validate', dest='validate', action='store_true',
		help='validate parser output (default)')
	validation.add_argument('--no-validate', dest='validate', action='store_false',
		help='do not validate parser output')
	validation.set_defaults(validate=True)

def validator_argparser(parser, writable_file_action=None):
	parser.add_argument('--output-json', default='stdout', help='(default:  %(default)s)', action=writable_file_action)
	parser.add_argument('--output-error', default='stderr', help='(default:  %(default)s)', action=writable_file_action)
	parser.add_argument('--config-file', dest='config_file', metavar='', action=None,
		help='pull config file from this path')
	break_error = parser.add_mutually_exclusive_group()
	break_error.add_argument('--break-on-errors', dest='break_on_errors', action='store_true', help='(default)')
	break_error.add_argument('--no-break-on-errors', dest='break_on_errors', action='store_false')
	break_error.set_defaults(break_on_errors=True)
	break_warning = parser.add_mutually_exclusive_group()
	break_warning.add_argument('--break-on-warnings', dest='break_on_warnings', action='store_true')
	break_warning.add_argument('--no-break-on-warnings', dest='break_on_warnings', action='store_false', help='(default)')
	break_warning.set_defaults(break_on_warnings=False)

def digestor_argparser(parser, writable_file_action=None):
	parser.add_argument('--strategy', default='burp', choices=['vommit', 'absorb', 'burp', 'dbdiff', 'dbload', 'dbdiff_and_dbload'])
		

class Command(BaseCommand):
  help = "Initiates specified parsers for specified schools. If no school is provided, starts parsers for all schools."
  def add_arguments(self, parser):
  		cmd = self

		# NOTE: --no-color already specified
		# NOTE: verbosity already specified

  		# Setup Object for creating valid Django subparsers
  		# REF: http://stackoverflow.com/questions/36706220/is-it-possible-to-create-subparsers-in-a-django-management-command
		class SubParser(CommandParser):
			def __init__(self, **kwargs):
				super(SubParser, self).__init__(cmd, **kwargs)

		# Argparse hook to check for writable file within directory
		class writable_file(argparse.Action):
			def __call__(self, parser, namespace, values, option_string=None):
				prospective_file = values
				prospective_dir = os.path.dirname(os.path.abspath(prospective_file))
				if not os.path.isdir(prospective_dir):
					raise CommandError("writable_file: `%s` is not a valid file path" % (prospective_file) )
				if os.access(prospective_dir, os.W_OK):
					setattr(namespace,self.dest,prospective_file)
				else:
					raise CommandError("writable_file: `%s` is not a writable file" % (prospective_file) )

  	 	# optional argument to specify parser for specific school
		parser.add_argument('school', nargs='?', default='', 
			help='(default: empty <> parse all schools')

		# ArgumentParser for course parsers
		parser_argparser(parser)

		# FIXME --no-validate and validator conflict without resolutoin
		validator_sub_parser = parser.add_subparsers(title="validator", parser_class=SubParser, help='options when validating parser output')
		validator = validator_sub_parser.add_parser('validator', help='run python manage.py parse [school] validator --help for more')
		validator_argparser(validator, writable_file_action=writable_file)

  def success_print(self, message):
  	try:
		self.stdout.write(self.style.SUCCESS(message))
	except:
		self.stdout.write(message)

  def handle(self, *args, **options):
  	print options
  	print options.get('textbooks')
  	print options.get('verbosity')
  	print options.get('term_and_year')
  	print options.get('validate')
  	exit(2)

  	logging.basicConfig(level=logging.ERROR, filename='parse_errors.log')

  	schools_to_parse = course_parsers.keys()

  	schools = schools_to_parse
  	if options['school']:
  		if options['school'] in schools_to_parse:
  			schools = [options['school']]
  		else:
			self.stderr.write(self.style.ERROR("Invalid school provided. Valid options are: " + str(schools_to_parse)))
			exit(1)


	for school, do_parse in course_parsers.iteritems():
  		if school in schools:
			try:

				message = "Starting parser for %s.\n" % (school)
				self.success_print(message)
				logging.exception(message)

				do_parse()

				# set the last_updated information for the school's courses
				update_object, created = Updates.objects.update_or_create(
					school=school,
					update_field="Course",
					defaults={'last_updated': datetime.datetime.now()}
				)

			except Exception as e:
				error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
				logging.exception(error)
				self.stderr.write(self.style.ERROR(error))

	self.success_print("Finished!")
