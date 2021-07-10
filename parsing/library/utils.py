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

import collections
import dateutil
import os
import re
import simplejson as json

from datetime import datetime
import dateparser

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

    `str`::
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
        for k, v in list(dirt.items()):
            cleaned_value = clean(v)
            if cleaned_value is None:
                continue
            cleaned[k] = cleaned_value
    elif isinstance(dirt, list):
        cleaned = [x for x in map(clean, dirt) if x is not None]
    elif isinstance(dirt, str):
        cleaned = UNICODE_WHITESPACE.sub(' ', dirt).strip()
    else:
        return dirt

    if len(cleaned) == 0:
        return None
    return cleaned


def make_list(x=None):
    """Wrap in list if not list already.

    If input is None, will return empty list.

    Args:
        x: Input.

    Returns:
        list: Input wrapped in list.
    """
    if x is None:
        x = []
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
        >>> d.c.ca, d.c['ca']
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
        for key, value in list(dct.items()):
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
            key: rec(value) for key, value in list(self.items())
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
    """Recursive update to dictionary w/o overwriting upper levels.

    Examples:
        >>> update({0: {1: 2, 3: 4}}, {1: 2, 0: {5: 6, 3: 7}})
        {0: {1: 2}}
    """
    for k, v in u.items():
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
    if isinstance(x, collections.Iterable) and not isinstance(x, str):
        return x
    else:
        return (x,)


def dir_to_dict(path):
    """Recursively create nested dictionary representing directory contents.

    Args:
        path (str): The path of the directory.

    Returns:
        dict: Dictionary representation of the directory.
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


def titlize(name):
    """Format name into pretty title.

    Will uppercase roman numerals.
    Will lowercase conjuctions and prepositions.

    Examples:
        >>> titlize('BIOLOGY OF CANINES II')
        Biology of Canines II
    """
    if name is None:
        return None

    titled = []
    for idx, word in enumerate(name.split()):
        if re.match(r'^[ivx]+$', word.lower()) is not None:
            word = word.upper()
        elif idx == 0:
            word = word.title()
        elif word.lower() in conjunctions_and_prepositions:
            word = word.lower()
        else:
            word = word.title()
        titled.append(word)
    return ' '.join(titled)


def dict_filter_by_dict(a, b):
    """Filter dictionary a by b.

    dict or set
    Items or keys must be string or regex.
    Filters at arbitrary depth with regex matching.

    Args:
        a (dict): Dictionary to filter.
        b (dict): Dictionary to filter by.

    Returns:
        dict: Filtered dictionary
    """
    if b is None:
        return a

    filtered = {}
    for x, ys in list(a.items()):
        for p, qs in list(b.items()):
            m = re.match(str(p), str(x))
            if m is None:
                continue
            if isinstance(ys, list):
                filtered.setdefault(x, [])
            elif isinstance(ys, dict):
                filtered.setdefault(x, {})
            for y in ys:
                for q in qs:
                    n = re.match(str(q), str(y))
                    if n is None:
                        continue
                    if isinstance(ys, list):
                        filtered[x].append(y)
                    elif isinstance(ys, dict):
                        filtered[x][y] = a[x][y]
    return filtered


def dict_filter_by_list(a, b):
    if b is None:
        return a
    filtered = None
    if isinstance(a, list):
        filtered = []
    elif isinstance(a, set):
        filtered = set()
    elif isinstance(a, dict):
        filtered = {}
    for x in a:
        for y in b:
            m = re.match(str(y), str(x))
            if m is None:
                continue
            if isinstance(a, list):
                filtered.append(x)
            elif isinstance(a, set):
                filtered.add(x)
            elif isinstance(a, dict):
                filtered[x] = a[x]
    return filtered


def time24(time):
    """Convert time to 24hr format.

    Args:
        time (str): time in reasonable format

    Returns:
        str: 24hr time in format hh:mm

    Raises:
        ParseError: Unparseable time input.
    """
    from parsing.library.validator import ValidationError

    if isinstance(time, str):
        time = dateutil.parser.parse(time)
    if not isinstance(time, datetime):
        raise ValidationError('invalid time input {}'.format(time))
    return time.strftime('%H:%M')

def short_date(date):
    """Convert input to %m-%d-%y format. Returns None if input is None.

    Args:
        date (str): date in reasonable format

    Returns:
        str: Date in format %m-%d-%y if the input is not None.

    Raises:
        ParseError: Unparseable time input.
    """
    from parsing.library.validator import ValidationError

    if date is not None:
        if isinstance(date, str):
            date = dateparser.parse(date)
        if not isinstance(date, datetime):
            raise ValidationError('invalid date input {}'.format(date))
        return date.strftime('%m-%d-%y')
    else:
        return None


def is_short_course(date_start, date_end, short_course_weeks_limit):
    """ Checks whether a course's duration is longer than a short term
        course week limit or not. Limit is defined in the config file for
        the corresponding school.
    
    Arguments:
        date_start {str} -- Any reasonable date value for start date
        date_end {str} -- Any reasonable date value for end date
        short_course_weeks_limit {int} -- Number of weeks a course can be 
        defined as "short term".
    
    Raises:
        ValidationError: Invalid date input
        ValidationError:  Invalid date input
    
    Returns:
        bool -- Defines whether the course is short term or not.
    """

    from parsing.library.validator import ValidationError

    is_short = False

    if short_course_weeks_limit is not None:
        if isinstance(date_start, str):
            date_start = dateparser.parse(date_start)
        if isinstance(date_end, str):
            date_end = dateparser.parse(date_end)
        if not isinstance(date_start, datetime):
            raise ValidationError('invalid date input {}'.format(date_start))
        if not isinstance(date_end, datetime):
            raise ValidationError('invalid date input {}'.format(date_end))
        date_diff = date_end - date_start
        is_short = date_diff.days <= short_course_weeks_limit * 7

    return is_short

class SimpleNamespace:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
    def __repr__(self):
        keys = sorted(self.__dict__)
        items = ("{}={!r}".format(k, self.__dict__[k]) for k in keys)
        return "{}({})".format(type(self).__name__, ", ".join(items))
    def __eq__(self, other):
        return self.__dict__ == other.__dict__