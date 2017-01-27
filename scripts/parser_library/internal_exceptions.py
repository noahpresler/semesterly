# TODO - create base library exception class, deal with multiple inheritance

class JsonValidationError(ValueError):
	'''Raise when fails validation condition.'''

	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json # TODO - validate json
		super(JsonValidationError, self).__init__(message, json, *args)

class JsonValidationWarning(UserWarning):
	'''Create when triggers validation warning.'''

	def __init__(self, message, json=None, *args):
		self.message = message
		self.json = json
		super(JsonValidationWarning, self).__init__(message, json, *args)

class DigestionError(ValueError):
	'''Raise when fails digestion invariant.'''