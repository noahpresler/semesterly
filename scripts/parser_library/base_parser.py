"""
Parser Library: Base (course) Parser.

@org    Semeseterly
@author Michael N. Miller
@date   2/01/2017
"""

from __future__ import absolute_import, division, print_function

from abc import ABCMeta, abstractmethod

from scripts.parser_library.extractor import Extractor
from scripts.parser_library.ingestor import Ingestor
from scripts.parser_library.requester import Requester


class BaseParser:
    """Abstract base parser for data pipeline.

    Attributes:
        extractor (parser_library.extractor): pipeline extractor
        ingestor (parser_library.ingestor): pipeline ingestor
        requester (parser_library.requester): pipeline requester
        school (str): School that parser is for.
    """

    __metaclass__ = ABCMeta

    def __init__(self, school,
                 config_path=None,
                 output_path=None,  # TODO - support stdout
                 output_error_path=None,
                 break_on_error=True,
                 break_on_warning=False,
                 skip_shallow_duplicates=True,
                 hide_progress_bar=True,
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
            skip_shallow_duplicates (bool, optional): Description
            hide_progress_bar (bool, optional): Description
            validate (bool, optional): Description
            tracker (None, parser_library.tracker, optional): Description
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
                                 skip_shallow_duplicates=skip_shallow_duplicates,
                                 hide_progress_bar=hide_progress_bar,
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
        self.ingestor.wrap_up()


class CourseParser(BaseParser):
    """Abstract course parser."""

    __metaclass__ = ABCMeta

    @abstractmethod
    def __init__(self, school, **kwargs):
        """Create course parser instance.

        Args:
            school (str)
            **kwargs: pass-through
        """
        super(CourseParser, self).__init__(school, **kwargs)

    @abstractmethod
    def start(self, **kwargs):
        """Start the parse."""
