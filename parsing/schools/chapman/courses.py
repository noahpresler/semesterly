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

from parsing.common.peoplesoft.courses import PeoplesoftParser


class Parser(PeoplesoftParser):
    """Chapman course parser."""

    URL = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'

    def __init__(self, **kwargs):
        """Construct course parser.

        Args:
            **kwargs: pass-through
        """
        super(Parser, self).__init__('chapman', Parser.URL, **kwargs)
