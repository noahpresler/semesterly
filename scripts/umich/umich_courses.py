# @what     UMich Course Parser
# @org      Semester.ly
# @author   Michael N. Miller
# @date     2/13/17

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
	raise NotImplementedError('run parser with manage.py')
if __name__ == "__main__":
	main()
