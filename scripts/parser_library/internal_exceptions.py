class CourseParseError(Exception):
	'''Raise during runtime login error in course parsers.'''
	# TODO - add stats here like department, course, current request, etc.

class JsonValidationError(ValueError):
	'''Raise when fatal failure of validation condition.'''
	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json # TODO - validate json
		super(JsonValidationError, self).__init__(message, json, *args)

class JsonValidationWarning(UserWarning):
	'''Raise when user `should` be made aware of non-optimal, non-fatal condition.'''
	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json
		super(JsonValidationWarning, self).__init__(message, json, *args)

class JsonDuplicationWarning(JsonValidationWarning):
	'''Raise when validation detects duplicate json objects in the same parse.'''
	def __init__(self, message, json=None, *args):
		super(JsonDuplicationWarning, self).__init__(message, json, *args)

class DigestionError(ValueError):
	'''Raise when fails digestion invariant.'''

class IngestorWarning(UserWarning):
	'''Raise when user should be notified of non-optimal usage of ingestor.'''
	def __init__(self, message, json=None, *args):
	super(IngestorWarning, self).__init__(message, json, *args)