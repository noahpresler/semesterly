import simplejson as json

class dotjson(dict):
	__getattr__ = dict.get
	__setattr__ = dict.__setitem__
	__delattr__ = dict.__delitem__

	def __init__(self, data):
		if isinstance(data, dotjson):
			raise NotImplementedError('mulitple dotjson instantiation not allowed.')
		if isinstance(data, basestring):
			data = json.loads(data)

		data = dotjson._wrap(data)

		if not isinstance(data, list):
			for name, value in data.iteritems():
				setattr(self, name, dotjson._wrap(value))
		else:
			self._data = data

	def __getitem__(self, index):
		if not isinstance(self._data, (tuple, list, set, frozenset)):
			raise TypeError('dotjson instance not list')
		return self._data[index]

	def __iter__(self):
		# Support iteration for single object
		if not isinstance(self._data, (tuple, list, set, frozenset)):
			yield self
		else:
			for obj in self._data:
				yield obj

	@staticmethod
	def _wrap(value):
		if isinstance(value, (tuple, list, set, frozenset)):
			return [ dotjson(v) for v in value ]
		else:
			return value

j = [
		{
			'a': 2
		},
		{
			'b': 1
		}
	]

j = dotjson(j)
print j[1].a
for a in j:
	print a
for a in j[0]:
	print a
print j[1].b
print j
# k = dotjson(j)
# print k