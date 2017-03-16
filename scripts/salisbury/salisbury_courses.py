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
