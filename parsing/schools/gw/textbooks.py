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

from parsing.common.textbooks.bkstr_dot_com import BkstrDotComParser


class Parser(BkstrDotComParser):
    """GW textbook parser.

    Inherits for bkstr.com parser.
    """

    def __init__(self, **kwargs):
        """Create instance of textbook parser.

        Args:
            **kwargs: pass-through
        """
        store_id = '10370'
        super(Parser, self).__init__('gw', store_id, **kwargs)
