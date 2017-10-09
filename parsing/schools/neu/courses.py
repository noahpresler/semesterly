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

from bs4 import NavigableString, Tag

from parsing.library.base_parser import BaseParser
from parsing.library.exceptions import ParseError
from parsing.library.utils import safe_cast, dict_filter_by_dict
from semesterly.settings import get_secret


class Parser(BaseParser):
   
    def __new__(cls, *args, **kwargs):
        """Set static variables within closure.

        Returns:
            Parser
        """
        new_instance = object.__new__(cls)
     
        return new_instance

    def __init__(self, **kwargs):
        """Construct GW parser object.

        Args:
            **kwargs: pass-through
        """
        super(Parser, self).__init__('neu', **kwargs)

    # Required to prevent the python code from writing courses.json.
    # The JS script saves the courses.json when using search neu scrapers.
    def end(self):
      pass

    def start(self,
              years_and_terms_filter=None,
              departments_filter=None,
              verbosity=3,
              textbooks=None):


      path = os.path.join(os.path.dirname(__file__), 'main.js')
      subprocess.call(['node',  path])
      print("done scraping neu")
     