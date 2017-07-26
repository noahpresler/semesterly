"""Filler."""
from parsing.common.bn_textbook_parser import BarnesAndNoblesParser


class Parser(BarnesAndNoblesParser):
    """JHU Textbook Parser."""

    def __init__(self, term="Fall", year=2017, **kwargs):
        super(JHUTextbookParser, self).__init__(
            "18053",
            "johns-hopkins.bncollege.com",
            "jhu",
            ".",
            term,
            year,
            **kwargs)
