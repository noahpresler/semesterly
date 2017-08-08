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

from __future__ import absolute_import, division, print_function

import collections
import dateutil.parser as dparser
import os
import re
import simplejson as json

from datetime import datetime

from parsing.library.exceptions import ParseError
from parsing.library.words import conjunctions_and_prepositions

UNICODE_WHITESPACE = re.compile(r'(?:\u00a0)|(?:\xc2)|(?:\xa0)', re.IGNORECASE)


def clean(dirt):
    """Recursively clean json-like object.

    `list`::
        - remove `None` elements
        - `None` on empty list

    :obj:`dict`::
        - filter out None valued key, value pairs
        - `None` on empty dict

    `basestring`::
        - convert unicode whitespace to ascii
        - strip extra whitespace
        - None on empty string

    Args:
        dirt: the object to clean

    Returns:
        Cleaned `dict`, cleaned `list`, cleaned `string`, or pass-through.
    """
    cleaned = None

    if isinstance(dirt, dict):
        cleaned = {}
        for k, v in dirt.items():
            cleaned_value = clean(v)
            if cleaned_value is None:
                continue
            cleaned[k] = cleaned_value
    elif isinstance(dirt, list):
        cleaned = filter(
            lambda x: x is not None,
            map(clean, dirt)
        )
    elif isinstance(dirt, basestring):
        cleaned = UNICODE_WHITESPACE.sub(' ', dirt).strip()
    else:
        return dirt

    if len(cleaned) == 0:
        return None
    return cleaned


def make_list(x):
    """Wrap in list if not list already.

    Args:
        x: Input.

    Returns:
        list: Input wrapped in list.
    """
    if not isinstance(x, list):
        x = [x]
    return x


class DotDict(dict):
    """Dot notation access for dictionary.

    Supports set, get, and delete.

    Examples:
        >>> d = DotDict({'a': 1, 'b': 2, 'c': {'ca': 31}})
        >>> d.a, d.b
        (1, 2)
        >>> d['a']
        1
        >>> d['a'] = 3
        >>> d.a, d['b']
        (3, 2)
        >>> d.a.ca, d.a['ca']
        (31, 31)
    """

    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__

    def __init__(self, dct):
        """Create instance.

        Args:
            dct (dict): Dictionary to create DotDict with.
        """
        for key, value in dct.items():
            if hasattr(value, 'keys'):
                value = DotDict(value)
            self[key] = value

    def as_dict(self):
        """Return pure dictionary representation of self."""
        def rec(d):
            if isinstance(d, DotDict):
                return d.as_dict()
            return d
        return {
            key: rec(value) for key, value in self.items()
        }


def pretty_json(obj):
    """Prettify object as JSON.

    Args:
        obj (dict): Serializable object to JSONify.

    Returns:
        str: Prettified JSON.
    """
    return '{}'.format(json.dumps(obj,
                                  sort_keys=True,
                                  indent=2,
                                  separators=(',', ': ')))


def safe_cast(val, to_type, default=None):
    """Attempt to cast to specified type or return default.

    Args:
        val: Value to cast.
        to_type: Type to cast to.
        default (None, optional): Description

    Returns:
        to_type: Description
    """
    try:
        return to_type(val)
    except (ValueError, TypeError):
        return default


def update(d, u):
    """Recursive update to dictionary w/o overwriting upper levels."""
    for k, v in u.iteritems():
        if isinstance(v, collections.Mapping):
            r = update(d.get(k, {}), v)
            d[k] = r
        else:
            d[k] = u[k]
    return d


def iterrify(x):
    """Create iterable object if not already.

    Will wrap `str` types in extra iterable eventhough `str` is iterable.

    Examples:
        >>> for i in iterrify(1):
        ...     print(i)
        1
        >>> for i in iterrify([1]):
        ...     print(i)
        1
        >>> for i in iterrify('hello'):
        ...     print(i)
        'hello'
    """
    if isinstance(x, collections.Iterable) and not isinstance(x, basestring):
        return x
    else:
        return (x,)


def dir_to_dict(path):
    """Recursively create nested dictionary representing directory contents.

    Args:
        path (str): The path of the directory.

    Returns:
        dict: Dictionary representation of the directory.

    Example(s)::
        >>> print('hi')
        {
            "name": ""
            "kind": "directory",
            "children": [
                {
                    "name": "child_dir_a",
                    "kind": "directory",
                    "children": [
                        {
                            "name": "file0",
                            "kind": "file"
                        }
                    ]
                },
                {
                    "name": "file1.txt",
                    "kind": "file"
                }
            ]
        }
    """
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['kind'] = "directory"
        d['children'] = [
            dir_to_dict(os.path.join(path, x)) for x in os.listdir(path)
        ]
    else:
        d['kind'] = "file"
    return d


def time24(time):
    """Convert time to 24hr format.

    Args:
        time (str): time in reasonable format

    Returns:
        str: 24hr time in format hh:mm

    Raises:
        ParseError: Unparseable time input.
    """
    if isinstance(time, str):
        time = dparser.parse(time)
    if not isinstance(time, datetime):
        raise ParseError('invalid time input')
    return time.strftime('%H:%M')

_roman_numeral = re.compile(r'^[ivx]+$')


def titlize(name):
    """Format name into pretty title.

    Will uppercase roman numerals.
    Will lowercase conjuctions and prepositions.

    Examples:
        >>> titlize('BIOLOGY OF ANIMALS II)
        Biology of Animals II
    """
    titled = []
    for word in name.lower().split():
        if _roman_numeral.match(word) is not None:
            word = word.upper()
        elif word in conjunctions_and_prepositions:
            word = word.title()
        titled.append(word)
    return ' '.join(titled)
