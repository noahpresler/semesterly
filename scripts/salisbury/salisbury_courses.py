# @what    Salisbury Course Parser
# @org     Semester.ly
# @author  Michael N. Miller
# @date	   2/13/17

from scripts.peoplesoft.courses import PeoplesoftParser

class SalisburyParser(PeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'salisbury'
		url = 'https://gullnet.salisbury.edu/psc/csprdguest/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		super(SalisburyParser, self).__init__(school, url, **kwargs)

	def start(self,
		year=None,
		term=None,
		department=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		years_and_terms = {
			'2015': {
				'Fall':   '2158',
				'Spring': '2154',
				'Summer': '2156',
				'Winter': '2152'
				''
			},
			'2016': {
				'Fall':   '2168',
				'Spring': '2164',
				'Summer': '2166',
				'Winter': '2162'
			},
			'2017': {
				'Fall': '2178',
				'Spring': '2174',
				'Summer': '2176',
				'Winter': '2172'
			}
		}

		if term and year:
			years_and_terms = super(SalisburyParser, self).filter_term_and_year(years_and_terms, year, term)

		# Call Peoplesoft parse method
		self.parse(years_and_terms,
			department=department,
			textbooks=textbooks,
			verbosity=verbosity)

def main():
	raise NotImplementedError('run with manage.py')
if __name__ == "__main__":
	main()
