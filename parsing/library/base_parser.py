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

from abc import ABCMeta, abstractmethod

from parsing.library.extractor import Extractor
from parsing.library.ingestor import Ingestor
from parsing.library.requester import Requester


class BaseParser:
    """Abstract base parser for data pipeline parsers.

    Attributes:
        extractor (library.extractor): pipeline extractor
        ingestor (library.ingestor): pipeline ingestor
        requester (library.requester): pipeline requester
        school (str): School that parser is for.
    """

    __metaclass__ = ABCMeta

    def __init__(self, school,
                 config_path=None,
                 output_path=None,
                 output_error_path=None,
                 break_on_error=True,
                 break_on_warning=False,
                 skip_duplicates=True,
                 display_progress_bar=False,
                 validate=True,
                 tracker=None):
        """Create base parser instance.

        Args:
            school (str): Description
            config_path (None, str, optional): Description
            output_path (None, str, optional): Description
            output_error_path (None, str, optional): Description
            break_on_error (bool, optional): Description
            break_on_warning (bool, optional): Description
            skip_duplicates (bool, optional): Description
            display_progress_bar (bool, optional): Description
            validate (bool, optional): Description
            tracker (None, optional): Description
        """
        self.school = school
        self.requester = Requester()
        self.extractor = Extractor()
        self.ingestor = Ingestor(school,
                                 config_path,
                                 output_path,
                                 output_error_path,
                                 break_on_error=break_on_error,
                                 break_on_warning=break_on_warning,
                                 skip_duplicates=skip_duplicates,
                                 display_progress_bar=display_progress_bar,
                                 validate=validate,
                                 tracker=tracker)

    @abstractmethod
    def start(self, **kwargs):
        """Start the parse.

        Args:
            **kwargs: pass-through
        """

    def end(self):
        """Finish the parse."""
        self.ingestor.end()
