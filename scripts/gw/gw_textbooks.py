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

from scripts.textbooks.bkstr_dot_com import BkstrDotComParser

class GWTextbookParser(BkstrDotComParser):
	def __init__(self, **kwargs):
		store_id = '10370'
		super(GWTextbookParser, self).__init__('gw', store_id, **kwargs)

def main():
	p = GWTextbookParser(hide_progress_bar=True)
	p.start()
if __name__ == '__main__':
	main()