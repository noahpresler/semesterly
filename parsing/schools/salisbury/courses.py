"""Filler."""
from parsing.common.peoplesoft.courses import PeoplesoftParser


class Parser(PeoplesoftParser):
    """Course parser for Salisbury University."""

    URL = 'https://gullnet.salisbury.edu/psc/csprdguest/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'

    def __init__(self, **kwargs):
        """Construct Salisbury parsing object."""
        super(Parser, self).__init__('salisbury', Parser.URL, **kwargs)

    def start(self, years=None, **kwargs):
        """Start parsing."""
        if years is None:
            years = ['2016', '2017']
        super(Parser, self).start(years=years, **kwargs)
