"""Filler."""
from parsing.common.bn_textbook_parser import BarnesAndNoblesParser


class Parser(BarnesAndNoblesParser):
    """Textbook parser for University of Michigan."""

    def __init__(self, term="Fall", year=2017, **kwargs):
        super(Parser, self).__init__(
            "28052",  # storeid
            "umichigan.bncollege.com",
            "umich",
            "-",
            term,
            year,
            **kwargs)
