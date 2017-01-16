#!/usr/bin/env python2

import os, json, jsonschema

def dict_raise_on_duplicates(ordered_pairs):
    """Reject duplicate keys."""
    d = {}
    for k, v in ordered_pairs:
        if k in d:
           raise KeyError("duplicate key: %r" % (k,))
        else:
           d[k] = v
    return d

absolute_path_to_base_directory = '/home/mike/Documents/semesterly/scripts/parser_library/schemas/'
base_filename = 'tester.json'

with open('test01.json') as g:
	data = json.loads(g.read(), object_pairs_hook=dict_raise_on_duplicates)
with open(os.path.join(absolute_path_to_base_directory, base_filename)) as f:
	schema = json.load(f)
resolver = jsonschema.RefResolver('file://' + absolute_path_to_base_directory + '/', schema)

try:
	jsonschema.Draft4Validator(schema, resolver=resolver).validate(data)
except jsonschema.ValidationError as e:
	print e.message
	print e.path
	print e.instance
except jsonschema.exceptions.SchemaError as e:
	print 'SCHEMA FAILED'
	print e