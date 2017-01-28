import sys, pipes, simplejson as json
from datetime import datetime
from scripts.parser_library.internal_utils import *
from scripts.parser_library.internal_exceptions import JsonValidationError, JsonValidationWarning, DigestionError

class Logger(object):
	def __init__(self, logfile=None, errorfile=None):
		if logfile:
			# Remove special character formatting (ex: pretty_json)
			t = pipes.Template()
			t.append('sed "s,\x1B\[[0-9;]*[a-zA-Z],,g"', '--')
			self.logfile = t.open(logfile, 'w')
		else:
			self.logfile = sys.stdout

		if errorfile:
			# Remove special character formatting
			t = pipes.Template()
			t.append('sed "s,\x1B\[[0-9;]*[a-zA-Z],,g"', '--')
			self.errorfile = t.open(errorfile, 'w')
		else:
			self.errorfile = sys.stderr

	# datetime.now().strftime("%Y%m%d-%H%M%S")

	def log_exception(self, error):
		output = '='*25 + '\n'
		if isinstance(error, ValueError):
			output += 'error: '
			if isinstance(error, JsonValidationError):
				output += error.message
				if error.json:
					output += '\n' + pretty_json(error.json)
			elif isinstance(error, DigestionError):
				output += error.message
			else:
				output += str(error)
		elif isinstance(error, UserWarning):
			output += 'warning: '
			if isinstance(error, JsonValidationWarning):
				output += error.message
				if error.json:
					output += '\n' + pretty_json(error.json)
			else:
				output += str(error)
		else:
			output += str(error)
		self.errorfile.write(output + '\n')

	def log_json(self, entry):
		if isinstance(entry, basestring):
			entry = json.loads(entry)
		self.logfile.write(pretty_json(entry))

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

class JsonListLogger(Logger):
	def __init__(self, logfile=None, errorfile=None):
		self.first = True # unset after open entry added
		super(JsonListLogger, self).__init__(logfile, errorfile)

	def open(self):
		self.logfile.write('[\n')

	def close(self):
		self.logfile.write(']\n')

	def log(self, entry):
		output = ',' if not self.first else ''
		self.first = False # always set to zero
		if isinstance(entry, basestring):
			entry = json.loads(entry)
		output += '  ' + '  '.join(pretty_json(entry).splitlines(True)) # preserve and tab each newline
		self.logfile.write(output)
