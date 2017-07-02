"""
UMich Course Parser.

@org      Semester.ly
@author   Michael N. Miller
@date     2/13/17
"""

from __future__ import absolute_import, division, print_function

from scripts.peoplesoft.courses import UPeoplesoftParser


class UmichParser(UPeoplesoftParser):
    """Course parser for University of Michigan."""

    URL = 'https://csprod.dsc.umich.edu/psc/csprodpa/EMPLOYEE/HRMS/c/' \
          'COMMUNITY_ACCESS.M_SR_SC_CLS_SRCH.GBL'
    SCHOOL = 'umich'

    def __init__(self, **kwargs):
        """Construct new parsing instance."""
        base_url = 'https://csprod.dsc.umich.edu/services/schedofclasses'
        super(UmichParser, self).__init__(UmichParser.SCHOOL, UmichParser.URL,
                                          term_base_url=base_url, **kwargs)

    def start(self,
              years=None,
              terms=None,
              departments=None,
              textbooks=True,
              verbosity=3,
              **kwargs):
        """Start parsing."""
        years_and_terms = {
            '2016': {
                'Summer': '2100',
                'Fall': '2110',
            },
            '2017': {
                'Winter': '2120',
                'Spring': '2130',
                'Spring/Summer': '2140',
                'Summer': '2150',
                'Fall': '2160',
            }
        }

        self.parse(
            years_and_terms=years_and_terms,
            cmd_years=years,
            cmd_terms=terms,
            cmd_departments=departments,
            cmd_textbooks=textbooks,
            verbosity=verbosity)
