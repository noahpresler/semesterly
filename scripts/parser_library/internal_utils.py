import re, collections

def cleandict(d):
	if not isinstance(d, dict):
		return deep_clean(d)
	return { k: cleandict(v) for k,v in d.iteritems() if deep_clean(v) is not None }

def make_list(l, base_type=basestring):
	if not isinstance(l, list):
		l =[l]
	if isinstance(l, base_type):
		l = [l]
	return deep_clean(l)

# FIXME -- 
# NOTE: mutates text, unicode whitspace removal should be part of extractor
def deep_clean(a):
	if not a: return None
	whitespace = re.compile(r'(?:\u00a0)|(?:\xc2\xa0)', re.IGNORECASE)
	if isinstance(a, dict):
		a = cleandict(a) # recursively remove nested empty dictionaries
	elif isinstance(a, list):
		for i in range(len(a)):
			if isinstance(a[i], basestring):
				a[i] = whitespace.sub(' ', a[i]).strip()
	elif isinstance(a, basestring):
		a = whitespace.sub(' ', a).strip()
	try:
		b = filter(None, a)
		if len(a) == 0:
			return None
		a = b
	except TypeError:
		pass
	return a

def update(d, u):
	'''Recursive update to dictionary w/o overwriting upper levels.
	REF: http://stackoverflow.com/questions/3232943/update-value-of-a-nested-dictionary-of-varying-depth'''

	for k, v in u.iteritems():
		if isinstance(v, collections.Mapping):
			r = update(d.get(k, {}), v)
			d[k] = r
		else:
			d[k] = u[k]
	return d

class dotdict(dict):
	'''dot.notation access to dictionary attributes, recursive'''
	__getattr__ = dict.get
	__setattr__ = dict.__setitem__
	__delattr__ = dict.__delitem__

	def __init__(self, dct):
		for key, value in dct.items():
			if hasattr(value, 'keys'):
				value = dotdict(value)
			self[key] = value
