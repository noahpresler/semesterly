
class FinalExamScheduler:

	def __init__(self):
		self.list_of_rules = []
		self.schedule = {}

	def make_schedule(self, tt):
		'''
		Takes a timetable
		Returns a dictionary mapping each course code from the timetable to the final exam date/time for that course based on the rules of the scheduler.
		E.g.
			{
				'EN.600.440' : " Monday, May 5th 12pm",
				'EN.600.440' : " Monday, May 5th 12pm",
				'EN.600.440' : " Monday, May 5th 12pm"
			}
		'''
		self.schedule = {}
		for course in tt['courses']:
			# print "going through course"
			# print course
			for rule in self.list_of_rules:
				result = rule.apply(course)
				# print "rule getting applied"

				if result != None:
					self.schedule[int(course['id'])] = result
					break
			if result is None:
				self.schedule[int(course['id'])] = 'Exam time not found'

		return self.schedule

class Rule:
	def __init__(self, list_of_days, start_time, result, end_time="24:00", start_only=False, list_of_codes=None):
		self.list_of_days = list_of_days
		self.start_time = start_time
		self.end_time = end_time
		self.result = result
		self.start_only = start_only
		self.list_of_codes = list_of_codes

	def check_times(self,slot):
		return (not self.start_only and (int(slot['time_start'].split(':')[0]) >= int(self.start_time.split(':')[0]) and int(slot['time_end'].split(':')[0]) <= int(self.end_time.split(':')[0]))) | (self.start_only and (int(slot['time_start'].split(':')[0]) == int(self.start_time.split(':')[0])))
 
	def apply(self, course):
		if self.list_of_codes:
			if course['code'] in self.list_of_codes:
				return self.result
		else:
			filtered_slots = filter(lambda slot: slot['section_type'] == 'L' ,course['slots'])
			for slot in filtered_slots:
				if slot['day'] in self.list_of_days and self.check_times(slot):
					return self.result
			return None

	def printOut(self):
		print 'Days:', self.list_of_days, 'Start time:', self.start_time, 'End time:', self.end_time, "Result:", self.result

