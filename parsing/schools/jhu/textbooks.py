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

from parsing.common.bn_textbook_parser import BarnesAndNoblesParser


class Parser(BarnesAndNoblesParser):
    """JHU Textbook Parser."""

    # TODO - accept years and terms as filter

    def __init__(self, term="Fall", year=2017, **kwargs):
        super(Parser, self).__init__(
            "18053",
            "johns-hopkins.bncollege.com",
            "jhu",
            ".",
            term,
            year,
            **kwargs)
