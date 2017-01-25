def pretty_json(j):
	if isinstance(j, dict):
		j = json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
	l = lexers.JsonLexer()
	l.add_filter('whitespace')
	colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
	return colorful_json

def make_list(l, base_type=basestring):
	if isinstance(l, base_type):
		l = [l]
	return clean_empty(l)

def clean_empty(a):
	if not a: return None
	try:
		a = filter(None, a)
		if len(a) == 0:
			return None
	except TypeError:
		pass
	return a

def cleandict(d):
	if not isinstance(d, dict):
		return clean_empty(d)
	return dict((k, cleandict(v)) for k,v in d.iteritems() if clean_empty(v) is not None)

class dotdict(dict):
	"""dot.notation access to dictionary attributes, recursive"""
	__getattr__ = dict.get
	__setattr__ = dict.__setitem__
	__delattr__ = dict.__delitem__

	def __init__(self, dct):
		for key, value in dct.items():
			if hasattr(value, 'keys'):
				value = dotdict(value)
			self[key] = value