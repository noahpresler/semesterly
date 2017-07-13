import re

class FinalExamScheduler:
	"""
	Puts a timetable through a list of rules that determine when the final exam is 
	and returns a final exam schedule specific to that timetable.
	"""
	def __init__(self):
		self.list_of_rules = []
		self.schedule = {}

	def make_schedule(self, tt):
		"""
		Takes a timetable and returns a dictionary mapping each 
		course code from the timetable to the final exam date/time 
		for that course based on the rules of the scheduler.
		E.g.::
			{
				'EN.600.440' : " Monday, May 5th 12pm",
				'EN.600.440' : " Monday, May 5th 12pm",
				'EN.600.440' : " Monday, May 5th 12pm"
			}
		"""
		self.schedule = {}
		for course in tt['courses']:
			# print "going through course"
			# print course
			for rule in self.list_of_rules:
				result = rule.apply(course)
				# print "rule getting applied"

				if result != None:
					self.schedule[int(course['id'])] = {
						'time': result,
						'name': course['name'],
						'code': course['code'],
					}
					break
			if result is None:
				self.schedule[int(course['id'])] = 'Exam time not found'

		return self.schedule

class Rule:
	"""
	Represents a rule that determines when the final exam is scheduled.

	Args:
		list_of_days(array): The rule applies to classes that meet on this day. Can be multiple or just one.
		start_time(str): The rule applies to classes that start at or after this time
		end_time(str): The rule applies to classes that end at or before this time (Provided this is not a 'start-only' rule i.e. that
			only the time at which the class starts matters to whether the final exam matches or not.)
		result(str): The final exam time.
		start_only(bool): The rule only needs to match the course's start time, not the start and end time.
		list_of_codes(str): The rule applies to these 'special' classes. Only need to check whether the course code matches for the rule to apply.
		code_regex(str): The rule applies to this wide range of courses that has a common pattern.
	
	"""
	def __init__(self, list_of_days=None, start_time=None, result=None, end_time="24:00", start_only=False, list_of_codes=None, code_regex=None):
		self.list_of_days = list_of_days
		self.start_time = start_time
		self.end_time = end_time
		self.result = result
		self.start_only = start_only
		self.list_of_codes = list_of_codes
		self.code_regex = re.compile(code_regex) if code_regex else None
		
	def check_times(self,slot):
		"""
		If the final exam depends on both the start and end time and the start 
		and end time match up with the rule then returns true
		"""
		return (not self.start_only and (int(slot['time_start'].split(':')[0]) >= int(self.start_time.split(':')[0]) and int(slot['time_end'].split(':')[0]) <= int(self.end_time.split(':')[0]))) | (self.start_only and (int(slot['time_start'].split(':')[0]) == int(self.start_time.split(':')[0])))
		
	def apply(self, course):
		"""
		If the rule applies to the course then returns when the final exam is (the Rule's result). Returns None if 
		rule does not apply.
		"""
		if self.code_regex:
			if self.code_regex.match(course['code']):
				return self.result
		elif self.list_of_codes:
			if course['code'] in self.list_of_codes:
				return self.result
		else:
			filtered_slots = filter(lambda slot: slot['section_type'] == 'L' ,course['slots'])
			for slot in filtered_slots:
				if slot['day'] in self.list_of_days and self.check_times(slot):
					return self.result
		return None

	def printOut(self):
		"""
		Prints out the days, start time, end time, and result of each Rule
		"""
		print 'Days:', self.list_of_days, 'Start time:', self.start_time, 'End time:', self.end_time, "Result:", self.result
