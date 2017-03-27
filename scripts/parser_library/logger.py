import sys, pipes, simplejson as json
from datetime import datetime
from pygments import highlight, lexers, formatters, filters
from scripts.parser_library.internal_utils import *
from scripts.parser_library.internal_exceptions import JsonValidationError, JsonValidationWarning, DigestionError

# TODO - look at logging library and integrate into Logger
#        might be able to remove all of this!!! :'(

class Logger(object):

	# NOTE: interface is rather confusing, consider revising
	def __init__(self, logfile=None, errorfile=None):
		if logfile:
			# FIXME -- does not work
			# Remove special character formatting (ex: Logger.pretty_json)
			# t = pipes.Template()
			# t.append('sed "s,\x1B\[[0-9;]*[a-zA-Z],,g"', '--')
			self.logfile = open(logfile, 'w')
		else:
			self.logfile = sys.stdout

		if errorfile:
			# Remove special character formatting
			t = pipes.Template()
			t.append('sed "s,\x1B\[[0-9;]*[a-zA-Z],,g"', '--')
			self.errorfile = t.open(errorfile, 'w')
		else:
			self.errorfile = sys.stderr

	# TODO - name created files with dates and labels
	# datetime.now().strftime("%Y%m%d-%H%M%S")

	def log_exception(self, error):
		output = '='*25 + '\n'
		if isinstance(error, ValueError):
			output += 'error: '
			if isinstance(error, JsonValidationError):
				output += error.message
				if error.json:
					output += '\n' + Logger.pretty_json(error.json)
			elif isinstance(error, DigestionError):
				output += error.message
			else:
				output += str(error)
		elif isinstance(error, UserWarning):
			output += 'warning: '
			if isinstance(error, JsonValidationWarning):
				output += error.message
				if error.json:
					output += '\n' + Logger.pretty_json(error.json)
			else:
				output += str(error)
		else:
			output += str(error)
		self.errorfile.write(output + '\n')

	def log_json(self, entry):
		if isinstance(entry, basestring):
			entry = json.loads(entry)
		self.logfile.write(Logger.pretty_json(entry))

	def log_normal(self, entry):
		self.logfile.write(str(entry) + '\n')

	def log(self, entry):
		if isinstance(entry, Exception):
			self.log_exception(entry)
		else:
			try:
				self.log_json(entry)
			except json.scanner.JSONDecodeError:
				self.log_normal(entry)

	@staticmethod
	def pretty_json(j):
		'''Format and colorize json for prettified output.'''
		if isinstance(j, basestring):
			j = json.loads(j)
		if isinstance(j, dict):
			j = json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
		return j

	@staticmethod
	def colored_json(j):
		j = Logger.pretty_json(j)
		l = lexers.JsonLexer()
		l.add_filter('whitespace')
		colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
		return colorful_json		

class JsonListLogger(Logger):
	def __init__(self, logfile=None, errorfile=None):
		self.first = True # unset after open entry added
		super(JsonListLogger, self).__init__(logfile, errorfile)

	def open(self):
		self.logfile.write('[\n')

	def close(self):
		self.logfile.write(']\n')

	def log(self, entry):
		if isinstance(entry, Exception):
			self.log_exception(entry)
		else:
			output = ',' if not self.first else ''
			self.first = False # always set to zero
			if isinstance(entry, basestring):
				entry = json.loads(entry)
			output += '  ' + '  '.join(Logger.pretty_json(entry).splitlines(True)) # preserve and tab each newline
			self.logfile.write(output)
