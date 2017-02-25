from final_exam_scheduler import FinalExamScheduler, Rule
import json

class JHUFinalExamScheduler(FinalExamScheduler):

	def __init__(self):

		# FALL 2016
		# rule1 = Rule(['M'],'8:00','12/20 2-5',start_only = True)
		# rule2 = Rule(['M'],'9:00','12/21 2-5',start_only = True)
		# rule3 = Rule(['M'],'10:00','12/16 2-5',start_only = True)
		# rule4 = Rule(['M'], '11:00','12/14 9-12', start_only = True)
		# rule5 = Rule(['M'], '12:00','12/17 2-5',start_only = True)
		# rule6 = Rule(['M'], '13:30','12/19 9-12', start_only = True)
		# rule7 = Rule(['M'], '15:00','12/15 9-12', start_only = True)
		# rule8 = Rule(['M'], '16:30','12/14 2-5',start_only = True)
		# rule9 = Rule(['M'], '18:00','12/19 6-9',start_only = True)
		# rule10 = Rule(['W'], '18:00','12/14 6-9',start_only = True)
		# rule11 = Rule(['T'], '9:00','12/16 9-12', start_only = True)
		# rule12 = Rule(['T'], '10:30','12/20 9-12', start_only = True)
		# rule13 = Rule(['T'], '12:00','12/15 2-5',start_only = True)
		# rule14 = Rule(['T'], '13:30','12/22 9-12', start_only = True)
		# rule15 = Rule(['T'], '15:00','12/21 9-12', start_only = True)
		# rule16 = Rule(['T'], '16:30','12/19 2-5',start_only = True)
		# rule17 = Rule(['T'], '18:00','12/20 6-9',start_only = True)

		# SPRING 2017
		rule1 = Rule(['M'],'8:00','5/18 9-12',start_only = True)
		rule2 = Rule(['M'],'9:00','5/17 9-12',start_only = True)
		rule3 = Rule(['M'],'10:00','5/16 9-12',start_only = True)
		rule4 = Rule(['M'], '11:00','5/15 9-12', start_only = True)
		rule5 = Rule(['M'], '12:00','5/12 9-12',start_only = True)
		rule6 = Rule(['M'], '13:30','5/11 9-12', start_only = True)
		rule7 = Rule(['M'], '15:00','5/13 2-5', start_only = True)
		rule8 = Rule(['M'], '16:30','5/16 2-5',start_only = True)
		rule9 = Rule(['M'], '18:00','5/15 6-9',start_only = True)
		rule10 = Rule(['W'], '18:00','5/17 6-9',start_only = True)
		rule11 = Rule(['R'], '18:00','5/11 6-9', start_only = True)
		rule12 = Rule(['T'], '9:00','5/12 2-5', start_only = True)
		rule13 = Rule(['T'], '10:30','5/13 9-12', start_only = True)
		rule14 = Rule(['T'], '12:00','5/17 2-5',start_only = True)
		rule15 = Rule(['T'], '13:30','5/18 2-5', start_only = True)
		rule16 = Rule(['T'], '15:00','5/11 2-5', start_only = True)
		rule17 = Rule(['T'], '16:30','5/15 2-5',start_only = True)
		rule18 = Rule(['T'], '18:00','5/16 6-9',start_only = True)

		self.list_of_rules = [rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9, rule10, rule11, rule12, rule13, rule14, rule15, rule16, rule17, rule18]
		self.schedule = {}
