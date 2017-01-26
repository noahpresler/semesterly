# TODO
# - handles for file
# - handles for verbosity

class Logger:
	def __init__(self, filename):
		self.file = open(filename, 'w+')
 
	def log(self, type, error, note='', **kwargs):
		message = {
			'INVALID_JSON': lambda e: ValidationError.invalid_json_error(e),
			'SCHEMA_JSON': lambda e: ValidationError.schema_json_error(e),
			'SCHEMA_DEFINITION': lambda e: ValidationError.schema_definition_error(e),
			'SUBJECT_JSON': lambda e: ValidationError.subject_json_error(e),
			'SUBJECT_DEFINITION': lambda e: ValidationError.subject_definition_error(e),
			'EXTENDED': lambda e: ValidationError.extended_definition_error(e),
			'UNKNOWN': lambda e: ValidationError.unknown_error(e)
		}.get(type)

		if not message:
			print 'TODO - "' + type + '" ERROR NOT DEALT WITH'
			print error
			return

		message = message(error)
		self.file.write(str(message))
		print message
		print error