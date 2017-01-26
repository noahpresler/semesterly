# TODO
# - handles for file
# - handles for verbosity

from scripts.parser_library.InternalUtils import *

class Logger:
	def __init__(self, filename=None, quiet=False):
		self.quiet = quiet
		if filename:
			self.file = open(filename, 'w+')
 
	def log_json(self, j):
		if not j or len(j) == 0:
			return
		if not self.quiet:
			print pretty_json(j)

	def log_error(self, message, note='', priority=3):
		print message

	def log(self, error, note='', priority=3):
		print error

		# message = message(error)
		# self.file.write(str(message))
		# print message
		# print error