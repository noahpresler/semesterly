import os, json, jsonschema

absolute_path_to_base_directory = '/home/mike/Documents/semesterly/scripts/parser_library/'
base_filename = 'tester.json'

with open('test01.json') as g:
	data = json.loads(g.read())
with open(os.path.join(absolute_path_to_base_directory, base_filename)) as file_object:
    schema = json.load(file_object)
resolver = jsonschema.RefResolver('file://' + absolute_path_to_base_directory + '/', schema)
jsonschema.Draft4Validator(schema, resolver=resolver).validate(data)

# with open('tester.json') as f:
# 	schema = f.read()
# 	with open('test01.json') as g:
# 		data = g.read()
# schema_path = 'file:///{0}/'.format(
#       os.path.dirname(get_file_path(schema)).replace("\\", "/"))
# resolver = RefResolver(schema_path, schema)

# try:
# 	jsonschema.validate(json.loads(data), json.loads(schema), resolver=resolver)
# except jsonschema.ValidationError as e:
# 	print e.message
# except jsonschema.SchemaError as e:
# 	print e
