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

from __future__ import absolute_import, division, print_function

from parsing.common.peoplesoft.courses import PeoplesoftParser


class ChapmanParser(PeoplesoftParser):
    """Chapman course parser."""

    URL = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'

    def __init__(self, **kwargs):
        """Construct parser instance.

        Args:
            **kwargs: pass-through to peoplsoft parser.
        """
        school = 'chapman'
        super(ChapmanParser, self).__init__(school,
                                            ChapmanParser.URL,
                                            **kwargs)

    def start(self,
              years=None,
              terms=None,
              departments=None,
              textbooks=True,
              verbosity=3,
              **kwargs):
        """Start the parse."""
        self.parse(
            cmd_years=years,
            cmd_terms=terms,
            cmd_departments=departments,
            cmd_textbooks=textbooks,
            verbosity=verbosity
        )
