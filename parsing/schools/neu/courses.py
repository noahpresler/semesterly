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

import re
import sys
import os
import subprocess

from parsing.library.base_parser import BaseParser


class Parser(BaseParser):
    def __init__(self, **kwargs):
        """Construct NEU parser object.

        Args:
            **kwargs: pass-through
        """
        super(Parser, self).__init__("neu", **kwargs)

    # Required to prevent the python code from writing courses.json.
    # The JS script saves the courses.json when using search neu scrapers.
    def end(self):
        pass

    def start(self, **kwargs):

        path = os.path.join(os.path.dirname(__file__), "main.js")
        subprocess.call(["node", "--max_old_space_size=8192", path])
        print("done scraping neu")
