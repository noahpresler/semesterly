# @what    Chapman Course Parser
# @org     Semester.ly
# @author  Michael N. Miller
# @date	   2/13/17

from scripts.peoplesoft.courses import PeoplesoftParser

class ChapmanParser(PeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'chapman'
		url = 'https://cs90prod.chapman.edu/psc/CS90PROD_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		super(ChapmanParser, self).__init__(school, url, **kwargs)

	def start(self,
		years=None,
		terms=None,
		year=None, # deprecated
		term=None, # deprecated
		department=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		self.parse(
			cmd_years=years,
			cmd_terms=terms,
			cmd_departments=department,
			cmd_textbooks=textbooks,
			verbosity=verbosity)

def main():
	raise NotImplementedError('run with manage.py')
if __name__ == "__main__":
	main()
