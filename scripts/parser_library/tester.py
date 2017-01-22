#!/usr/bin/env python

import os, re, jsonschema
import simplejson as json

# color json output of error message
from pygments import highlight, lexers, formatters, filters

def dict_raise_on_duplicates(ordered_pairs):
    """Reject duplicate keys."""
    d = {}
    for k, v in ordered_pairs:
        if k in d:
           raise KeyError("duplicate key: %r" % (k,))
        else:
           d[k] = v
    return d

def color_json(j):
	l = lexers.JsonLexer()
	l.add_filter('whitespace')
	colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
	return colorful_json

def pretty_format_error_message(path, message, schema_path):
	# NOTE: str(p) used to deal with indices (ex: #/time/days/1/), should make index []
	location = '/'.join(str(p) for p in path) + '/'
	s = ['is valid under each of', 'is not valid under any of the given schemas']
	if s[0] in message:
		s = s[0]
		a, b = message.split(s, 1)
		a = re.sub(r"u'(.*?)'", r'"\1"', a)
		b = '[' + re.sub(r"u'(.*?)'", r'"\1"', b) + ']'
		subject = json.dumps(json.loads(a), sort_keys=True, indent=2, separators=(',', ': '))
		valid_under = json.dumps(json.loads(b), sort_keys=True, indent=2, separators=(',', ': '))
		subject = color_json(subject)
		valid_under = color_json(valid_under)
		slocation = '/'.join(p for p in [re.sub(r"u'(.*?)'", r'"\1"', str(p)) for p in schema_path]) + '/'
		return '#/' + location + '\n' + subject + '\n' + s + '\n#/' + slocation + '\n' + valid_under

	elif s[1] in message:
		s = s[1]
		a = message.split(s)[0]
		a = re.sub(r"u'(.*?)'", r'"\1"', a)
		subject = json.dumps(json.loads(a), sort_keys=True, indent=2, separators=(',', ': '))
		subject = color_json(subject)
		return '#/' + location + '\n' + subject + '\n' + s

absolute_path_to_base_directory = '/home/mike/Documents/semesterly/scripts/parser_library/schemas/'
base_filename = 'courses.json'

test_dir = '/home/mike/Documents/semesterly/scripts/parser_library/ex_school/data/'

# NOTE: course.json needs .replace('\n', '')
with open(test_dir + 'courses.json') as g:
	try:
		data = json.loads(g.read(), object_pairs_hook=dict_raise_on_duplicates)
	except ValueError as e:
		print 'SUBJECT JSON INVALID'
		print e
		exit(1)

with open(os.path.join(absolute_path_to_base_directory, base_filename)) as f:
	try:
		schema = json.load(f)
	except ValueError as e:
		print 'SCHEMA JSON INVALID'
		print e
		exit(1)

resolver = jsonschema.RefResolver('file://' + absolute_path_to_base_directory + '/', schema)

try:
	jsonschema.Draft4Validator(schema, resolver=resolver).validate(data)
except jsonschema.ValidationError as error:
	print 'VALIDATION ERROR'
	print error

	print ''
	print 'message:', error.message
	print 'instance:', error.instance
	print 'parent:', error.parent
	print 'schema_path', error.path
	print pretty_format_error_message(error.path, error.message, error.relative_schema_path)
except jsonschema.exceptions.SchemaError as e:
	print 'SCHEMA FAILED'
	print e
except Exception as e:
	print 'SCHEMA (probably) FAILED'
	print e

