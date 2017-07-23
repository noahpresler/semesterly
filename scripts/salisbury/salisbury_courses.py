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

# @what    Salisbury Course Parser
# @org     Semester.ly
# @author  Michael N. Miller
# @date	   3/3/17

from scripts.peoplesoft.courses import PeoplesoftParser

class SalisburyParser(PeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'salisbury'
		url = 'https://gullnet.salisbury.edu/psc/csprdguest/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		super(SalisburyParser, self).__init__(school, url, **kwargs)

	def start(self,
		years=None,
		terms=None,
		departments=None,
		textbooks=True,
		verbosity=3,
		skip_shallow_duplicates=False,
		**kwargs):

		# Hotfix to narrow parsing range.
		if years is None:
			years = ['2016', '2017']

		self.parse(
			cmd_years=years,
			cmd_terms=terms,
			cmd_departments=departments,
			cmd_textbooks=textbooks,
			verbosity=verbosity)

if __name__ == "__main__":
	raise NotImplementedError('run with manage.py')
