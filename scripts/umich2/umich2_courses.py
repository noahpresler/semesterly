# @what     UMich Course Parser (Numero Duo)
# @org      Semester.ly
# @author   Michael N. Miller
# @date     2/13/17

from scripts.peoplesoft.courses import UPeoplesoftParser

class Umich2Parser(UPeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'umich2'
		url = 'https://csprod.dsc.umich.edu/psc/csprodpa/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.M_SR_SC_CLS_SRCH.GBL'
		super(Umich2Parser,self).__init__(school, url,
			term_base_url = 'https://csprod.dsc.umich.edu/services/schedofclasses', **kwargs)

	def start(self, 
		year=None,
		term=None,
		department=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		# NOTE: hardcoded semesters Fall, Interim, Spring 2016-2017
		years_and_terms = {
			"2016": {
				'Fall':'2110', 
			},
			"2017": {
				'Spring':'2120'
			}
		}

		if term and year:
			years_and_terms = super(Umich2Parser, self).filter_term_and_year(years_and_terms, year, term)

		# Call Peoplesoft parse method
		self.parse(years_and_terms,
			department=department,
			textbooks=textbooks,
			verbosity=verbosity)

def main():
	raise NotImplementedError('run parser with manage.py')
if __name__ == "__main__":
	main()