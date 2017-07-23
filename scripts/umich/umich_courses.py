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

# @what     UMich Course Parser
# @org      Semester.ly
# @author   Michael N. Miller
# @date     2/13/17

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

from scripts.peoplesoft.courses import UPeoplesoftParser

class UmichParser(UPeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'umich'
		url = 'https://csprod.dsc.umich.edu/psc/csprodpa/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.M_SR_SC_CLS_SRCH.GBL'
		super(UmichParser,self).__init__(school, url,
			term_base_url='https://csprod.dsc.umich.edu/services/schedofclasses', **kwargs)

	def start(self,
		years=None,
		terms=None,
		departments=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		# Hardcoded years-term codes.
		years_and_terms = {
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

		self.parse(
			years_and_terms=years_and_terms,
			cmd_years=years,
			cmd_terms=terms,
			cmd_departments=departments,
			cmd_textbooks=textbooks,
			verbosity=verbosity)

def main():
	raise NotImplementedError('run parser with manage.py')
if __name__ == "__main__":
	main()
