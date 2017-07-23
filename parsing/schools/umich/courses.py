"""Filler."""
from __future__ import absolute_import, division, print_function

from parsing.common.peoplesoft.courses import UPeoplesoftParser


class Parser(UPeoplesoftParser):
    """Course parser for University of Michigan."""

    URL = 'https://csprod.dsc.umich.edu/psc/csprodpa/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.M_SR_SC_CLS_SRCH.GBL'
    TERM_BASE_URL = 'https://csprod.dsc.umich.edu/services/schedofclasses'
    YEARS_AND_TERMS = {
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

    def __init__(self, **kwargs):
        """Construct new parsing instance."""
        super(Parser, self).__init__('umich',
                                     Parser.URL,
                                     term_base_url=Parser.TERM_BASE_URL,
                                     **kwargs)

    def start(self, **kwargs):
        """Start parsing."""
        # FIXME -- years and terms is definitely overlapping with keys in kwarggs
        super(Parser, self).start(years_and_terms=Parser.YEARS_AND_TERMS,
                                  **kwargs)
