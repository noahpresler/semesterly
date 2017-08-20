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

from django.apps import AppConfig


class SearchesConfig(AppConfig):
    name = 'searches'
    searcher = None

    def ready(self):
        """ Constructs Searcher object to be used if it can be built using course.vector field """
        from searches.utils import Searcher
        if not self.searcher:
            try:
                self.searcher = Searcher()
            except Exception as e:
                self.searcher = None
                print('Unable to create Searcher object:',
                      'setting searcher object to None and',
                      'using baseline_search instead.',
                      '\nError:', str(e))
