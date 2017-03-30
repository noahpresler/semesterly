import re, collections

def cleandict(dirt):
	if not isinstance(dirt, dict):
		return deep_clean(dirt)
	return { k: cleandict(v) for k,v in dirt.iteritems() if deep_clean(v) is not None }

def make_list(l):
	if not isinstance(l, list) or isinstance(l, basestring):
		l = [l]
	return l

# FIXME -- 
# NOTE: mutates text, unicode whitspace removal should be part of extractor
def deep_clean(dirt):
	if not dirt:
		return None
	whitespace = re.compile(r'(?:\u00a0)|(?:\xc2\xa0)', re.IGNORECASE)
	if isinstance(dirt, basestring):
		return whitespace.sub(' ', dirt).strip()
	if isinstance(dirt, dict):
		dirt = cleandict(dirt) # recursively remove nested empty dictionaries
	elif isinstance(dirt, list):
		for i in range(len(dirt)):
			if isinstance(dirt[i], basestring):
				dirt[i] = whitespace.sub(' ', dirt[i]).strip()
	elif isinstance(dirt, basestring):
		dirt = whitespace.sub(' ', dirt).strip()
	try:
		b = filter(None, dirt)
		if len(dirt) == 0:
			return None
		dirt = b
	except TypeError:
		pass
	return dirt

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

def safe_cast(val, to_type, default=None):
	try:
		return to_type(val)
	except (ValueError, TypeError):
		return default

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

def iterrify(x):
	if isinstance(x, collections.Iterable) and not isinstance(x, basestring):
		return x
	else:
		return (x,)