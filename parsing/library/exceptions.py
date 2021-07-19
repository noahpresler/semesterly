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

from parsing.library.utils import pretty_json


class PipelineException(Exception):
    """Data-pipeline exception class.

    Should never be constructed directly. Use:
        - PipelineError
        - PipelineWarning
    """

    def __init__(self, data, *args):
        """Construct PipelineError instance.

        Add data to args.

        Args:
            data: Prettified if possible.
            *args
        """
        if isinstance(data, dict):
            try:
                data = pretty_json(data)
            except TypeError:
                pass
        super(PipelineException, self).__init__(data, *args)

    def __str__(self):
        """String representation of error with newlines.

        Returns:
            str
        """
        return '\n' + '\n'.join(map(str, self.args))


class PipelineError(PipelineException):
    """Data-pipeline error class."""


class PipelineWarning(PipelineException, UserWarning):
    """Data-pipeline warning class."""


class ParseError(PipelineError):
    """Parser error class."""


class ParseWarning(PipelineWarning):
    """Parser warning class."""


class ParseJump(PipelineWarning):
    """Parser exception used for control flow."""
