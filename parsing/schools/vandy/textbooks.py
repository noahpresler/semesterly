"""Filler."""
from parsing.common.bn_textbook_parser import BarnesAndNoblesParser


class Parser(BarnesAndNoblesParser):
    """Vanderbilt textbook parser."""

    def __init__(self, **kwargs):
        super(Parser, self).__init__(
            "65163",
            "vanderbilt.bncollege.com",
            "vandy",
            "-",
            **kwargs)
