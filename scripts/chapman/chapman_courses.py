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

# @what    Chapman Course Parser
# @org     Semester.ly
# @author  Michael N. Miller
# @date	   2/13/17

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3
from scripts.peoplesoft.courses import PeoplesoftParser

class ChapmanParser(PeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'chapman'
		url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		super(ChapmanParser, self).__init__(school, url, **kwargs)

	def start(self,
		years=None,
		terms=None,
		departments=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		self.parse(
			cmd_years=years,
			cmd_terms=terms,
			cmd_departments=departments,
			cmd_textbooks=textbooks,
			verbosity=verbosity)

def main():
	raise NotImplementedError('run with manage.py')
if __name__ == "__main__":
	main()
