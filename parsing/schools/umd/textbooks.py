"""Filler."""
from parsing.common.bn_textbook_parser import BarnesAndNoblesParser


class Parser(BarnesAndNoblesParser):
    """UMD Textbook parser."""

    def __init__(self, term="Fall", year=2017,**kwargs):
        super(Parser, self).__init__(
            "15551",
            "umcp.bncollege.com",
            "umd",
            "",
            term,
            year,
            **kwargs)
