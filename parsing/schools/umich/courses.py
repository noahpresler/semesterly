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
                                     years_and_terms=Parser.YEARS_AND_TERMS,
                                     **kwargs)
