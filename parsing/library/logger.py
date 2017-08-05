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

import sys
import pipes
import simplejson as json
import logging

from pygments import highlight, lexers, formatters

from parsing.library.internal_exceptions import JsonValidationError, \
    JsonValidationWarning, DigestionError
from parsing.library.utils import pretty_json


class JSONStreamWriter(object):
    """Context to stream JSON list to file.

    Attributes:
        BRACES (TYPE): Description
        file (dict): Current object being JSONified and streamed.
        inner (TYPE): Description

    Examples:
        >>> with JSONStreamWriter(sys.stdout, type_='dict') as streamer:
        ...     streamer.write('a', 1)
        ...     streamer.write('b', 2)
        ...     streamer.write('c', 3)
        {
            "a": 1,
            "b": 2,
            "c": 3
        }
        >>> with JSONStreamWriter(sys.stdout, type_='dict') as streamer:
        ...     streamer.write('a', 1)
        ...     with streamer.write('data', type_=list) as streamer2:
        ...         streamer2.write({0:0, 1:1, 2:2})
        ...         streamer2.write({3:3, 4:'4'})
        ...     streamer.write('b', 2)
        {
            "a": 1,
            "data":
            [
                {
                    0: 0,
                    1: 1,
                    2: 2
                },
                {
                    3: 3,
                    4: "4"
                }
            ],
            "b": 2
        }
    """

    BRACES = {
        list: ('[', ']'),
        dict: ('{', '}'),
    }

    def __init__(self, obj, type_=list, inner=False, level=0):
        """Contruct JSONWriter instance.

        Args:
            obj (file, str): file or filepath to write to.
        """
        self.first = True
        self.level = level
        if isinstance(obj, file):
            self.file = obj
        else:
            self.file = open(obj, 'wb')
        self.open, self.close = JSONStreamWriter.BRACES[type_]
        self.inner = inner
        self.type_ = type_

    def write(self, *args, **kwargs):
        """Write to JSON in streaming fasion.

        Picks either write_obj or write_key_value

        Args:
            *args: pass-through
            **kwargs: pass-through

        Returns:
            return value of appropriate write function.

        Raises:
            ValueError: type_ is not of type list or dict.
        """
        if self.type_ == list:
            return self.write_obj(*args, **kwargs)
        elif self.type_ == dict:
            return self.write_key_value(*args, **kwargs)
        else:
            raise ValueError('type_ must be `list` or `dict`')

    def enter(self):
        """Wrapper for self.__enter__."""
        return self.__enter__()

    def exit(self):
        """Wrapper for self.__exit__."""
        self.__exit__(None, None, None)

    def __enter__(self):
        """Open JSON list."""
        print('  ' * self.level, self.open, file=self.file, sep='')
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        """Close JSON list and file object.

        Will not close stdout or stderr.
        """
        print('\n', '  ' * self.level, self.close,
              file=self.file,
              sep='',
              end='')
        if self.file == sys.stdout or self.file == sys.stderr or self.inner:
            return
        self.file.close()

    def write_key_value(self, key, value=None, type_=list):
        """Write key, value pair as string to file.

        If value is not given, returns new list streamer.

        Args:
            key (str): Description
            value (str, dict, None, optional): Description
            type_ (str, optional): Description

        Returns:
            None if value is given, else new JSONStreamWriter
        """
        if self.first:
            self.first = False
        else:
            print(',', file=self.file)

        if value is None:
            print('  ' * (self.level + 1), '"{}":'.format(key),
                  file=self.file,
                  sep='',
                  end='\n')
            return JSONStreamWriter(self.file,
                                    type_=type_,
                                    inner=True,
                                    level=self.level + 1)

        if isinstance(value, dict) or isinstance(value, list):
            tabbing = '\n' + '  ' * (self.level + 1)
            value = tabbing.join(pretty_json(value).splitlines())
        elif isinstance(value, str):
            value = '"{}"'.format(value)

        tabbing = '  ' * (self.level + 1)
        print(tabbing, '"{}": {}'.format(key, value),
              file=self.file,
              sep='',
              end='')

    def write_obj(self, obj):
        """Write obj as JSON to file.

        Args:
            obj (dict): Serializable obj to write to file.
        """
        if self.first:
            self.first = False
        else:
            print(',', file=self.file)

        tabbing = '  ' * (self.level + 1)
        print(tabbing + ('\n' + tabbing).join(pretty_json(obj).splitlines()),
              file=self.file,
              sep='\n',
              end='')


# class JSONFormatter(logging.Formatter):
#     """Simple JSON extension of Python logging.Formatter."""

#     def format(self, record):
#         """Format record message.

#         Args:
#             record (logging.LogRecord): Description

#         Returns:
#             str: Prettified JSON string.
#         """
#         return pretty_json(record.msg)

# logging.basicConfig(level=logging.INFO)
# handler = logging.StreamHandler(sys.stdout)
# handler.setFormatter(JSONFormatter())
# log = logging.getLogger()
# log.addHandler(handler)
# log.info({'foo': 'bar', 'bar': 'baz', 'num': 123, 'fnum': 123.456})


# TODO - look at logging library and integrate into Logger
#        might be able to remove all of this!!! :'(

class Logger(object):

    # NOTE: interface is rather confusing, consider revising
    def __init__(self, logfile=None, errorfile=None):
        if logfile:
            # FIXME -- does not work
            # Remove special character formatting (ex: Logger.pretty_json)
            # t = pipes.Template()
            # t.append('sed "s,\x1B\[[0-9;]*[a-zA-Z],,g"', '--')
            self.logfile = open(logfile, 'w')
        else:
            self.logfile = sys.stdout

        if errorfile:
            # Remove special character formatting
            t = pipes.Template()
            t.append('sed "s,\x1B\[[0-9;]*[a-zA-Z],,g"', '--')
            self.errorfile = t.open(errorfile, 'w')
        else:
            self.errorfile = sys.stderr

    # TODO - name created files with dates and labels
    # datetime.now().strftime("%Y%m%d-%H%M%S")

    def log_exception(self, error):
        output = '='*25 + '\n'
        if isinstance(error, ValueError):
            output += 'error: '
            if isinstance(error, JsonValidationError):
                output += error.message
                if error.json:
                    output += '\n' + Logger.pretty_json(error.json)
            elif isinstance(error, DigestionError):
                output += error.message
            else:
                output += str(error)
        elif isinstance(error, UserWarning):
            output += 'warning: '
            if isinstance(error, JsonValidationWarning):
                output += error.message
                if error.json:
                    output += '\n' + Logger.pretty_json(error.json)
            else:
                output += str(error)
        else:
            output += str(error)
        self.errorfile.write(output + '\n')

    def log_json(self, entry):
        if isinstance(entry, basestring):
            entry = json.loads(entry)
        self.logfile.write(Logger.pretty_json(entry))

    def log_normal(self, entry):
        self.logfile.write(str(entry) + '\n')

    def log(self, entry):
        if isinstance(entry, Exception):
            self.log_exception(entry)
        else:
            try:
                self.log_json(entry)
            except json.scanner.JSONDecodeError:
                self.log_normal(entry)

    @staticmethod
    def pretty_json(j):
        '''Format and colorize json for prettified output.'''
        if isinstance(j, basestring):
            j = json.loads(j)
        if isinstance(j, dict):
            j = json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
        return j

    @staticmethod
    def colored_json(j):
        j = Logger.pretty_json(j)
        l = lexers.JsonLexer()
        l.add_filter('whitespace')
        colorful_json = highlight(unicode(j, 'UTF-8'), l, formatters.TerminalFormatter())
        return colorful_json

    def close(self):
        self.logfile.write(']\n')
        self.logfile.close()
