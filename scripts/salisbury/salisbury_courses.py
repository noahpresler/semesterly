"""
Salisbury Course Parser.

@org     Semester.ly
@author  Michael N. Miller
@date    3/3/17
"""

from scripts.peoplesoft.courses import PeoplesoftParser


class SalisburyParser(PeoplesoftParser):
    """Course parser for Salisbury University."""

    URL = 'https://gullnet.salisbury.edu/psc/csprdguest/EMPLOYEE/SA' \
          '/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
    SCHOOL = 'salisbury'

    def __init__(self, **kwargs):
        """Construct parsing object."""
        super(SalisburyParser, self).__init__(SalisburyParser.SCHOOL,
                                              SalisburyParser.URL,
                                              **kwargs)

    def start(self,
              years=None,
              terms=None,
              departments=None,
              textbooks=True,
              verbosity=3,
              **kwargs):
        """Start parsing."""
        if years is None:
            years = ['2016', '2017']

        self.parse(
            cmd_years=years,
            cmd_terms=terms,
            cmd_departments=departments,
            cmd_textbooks=textbooks,
            verbosity=verbosity)
