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
		year=None,
		term=None,
		department=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		# NOTE: hardcoded semesters Fall 2016, Interim, Spring 2017
		years_and_terms = {
			"2016": {
				'Fall':'2168', 
			},
			"2017": {
				'Interim':'2172', 
				'Spring':'2174'
			}
		}

		if term and year:
			years_and_terms = super(ChapmanParser, self).filter_term_and_year(years_and_terms, year, term)

		# Call Peoplesoft parse method
		self.parse(years_and_terms,
			department=department,
			textbooks=textbooks,
			verbosity=verbosity)

def main():
	raise NotImplementedError('run with manage.py')
if __name__ == "__main__":
	main()
