# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import re, collections
import sys

def make_list(l):
	if not isinstance(l, list) or isinstance(l, basestring):
		l = [l]
	return l


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