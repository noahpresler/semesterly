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

import logging
import sys

from pygments import highlight, lexers, formatters

from parsing.library.utils import pretty_json


class JSONStreamWriter:
    """Context to stream JSON list to file.

    Attributes:
        BRACES (TYPE): Open close brace definitions.
        file (dict): Current object being JSONified and streamed.
        first (bool): Indicator if first write has been done by streamer.
        level (int): Nesting level of streamer.
        type_ (dict, list): Actual type class of streamer (dict or list).

    Examples:
        >>> with JSONStreamWriter(sys.stdout, type_=dict) as streamer:
        ...     streamer.write('a', 1)
        ...     streamer.write('b', 2)
        ...     streamer.write('c', 3)
        {
            "a": 1,
            "b": 2,
            "c": 3
        }
        >>> with JSONStreamWriter(sys.stdout, type_=dict) as streamer:
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

    def __init__(self, obj, type_=list, level=0):
        """Contruct JSONWriter instance.

        Args:
            obj (file, str): file or filepath to write to.
        """
        self.first = True
        self.level = level
        if (hasattr(obj, 'read') and hasattr(obj, 'write')):
            self.file = obj
            self.close_file = False
        else:
            self.file = open(obj, 'w')
            self.close_file = True
        self.open, self.close = JSONStreamWriter.BRACES[type_]
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
        if (self.file == sys.stdout or self.file == sys.stderr or
                self.level > 0 or not self.close_file):
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


class JSONFormatter(logging.Formatter):
    """Simple JSON extension of Python logging.Formatter."""
    def format(self, record):
        """Format record message.

        Args:
            record (logging.LogRecord): Description

        Returns:
            str: Prettified JSON string.
        """
        if isinstance(record.args, dict):
            try:
                prettified = pretty_json(record.args)
                record.msg += '\n' + prettified
            except TypeError:
                pass
        return super(JSONFormatter, self).format(record)


def colored_json(j):
    lexer = lexers.JsonLexer()
    lexer.add_filter('whitespace')
    colorful_json = highlight(str(pretty_json(j), 'UTF-8'),
                              lexer,
                              formatters.TerminalFormatter())
    return colorful_json


class JSONColoredFormatter(logging.Formatter):
    def format(self, record):
        if isinstance(record.args, dict):
            try:
                prettified = colored_json(record.args)
                record.msg += '\n' + prettified
            except TypeError:
                pass
        return super(JSONColoredFormatter, self).format(record)
