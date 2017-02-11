class CourseParseError(Exception):
	'''Raise during runtime login error in course parsers.'''
	# TODO - add stats here like department, course, current request, etc.

class JsonValidationError(ValueError):
	'''Raise when fatal failure of validation condition.'''
	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json # TODO - validate json
		super(JsonValidationError, self).__init__(message, json, *args)

	def __str__(self):
		return 'error: ' + self.message + '\n' + pretty_json(self.json)

class JsonValidationWarning(UserWarning):
	'''Raise when user `should` be made aware of non-optimal, non-fatal condition.'''
	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json
		super(JsonValidationWarning, self).__init__(message, json, *args)

	def __str__(self):
		return 'warning: ' + self.message + '\n' + pretty_json(self.json)

class JsonDuplicationWarning(JsonValidationWarning):
	'''Raise when validation detects duplicate json objects in the same parse.'''
	def __init__(self, message, json=None, *args):
		super(JsonDuplicationWarning, self).__init__(message, json, *args)

	def __str__(self):
		return 'warning: ' + self.message + '\n' + pretty_json(self.json)

class DigestionError(ValueError):
	'''Raise when fails digestion invariant.'''
	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json
		super(DigestionError, self).__init__(message, json, *args)

	def __str__(self):
		return 'error (digestion): ' + self.message + '\n' + pretty_json(self.json)

class IngestorWarning(UserWarning):
	'''Raise when user should be notified of non-optimal usage of ingestor.'''
	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json
		super(IngestorWarning, self).__init__(message, json, *args)

	def __str__(self):
		return 'warning: ' + self.message + '\n' + pretty_json(self.json)

import simplejson as json
def pretty_json(j):
	if j is None:
		return ''
	return json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
