import re

class FinalExamScheduler:
    """
    Puts a timetable through a list of rules. If the rule matches, a final
    exam schedule specific to that timetable will be returned.
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
    Represents a rule that can be matched based on several criteria: the day and time of the course, regex, or the course code.
    When a Rule matches, it will return result (the final exam time and day). Each Rule can only match one of these criterua, the 
    others are absent from the args list. If you want to have the day and time determine the Rule then start_time, start_only, 
    list_of_days, end-time (optional depending on whether start_only is true or not), and result should be filled. If you want to have Regex
    determine the final exam time then only regex and result need to be filled. If you want to use course code, then only course
    code and result need to be present.

    Args:
        list_of_days(array): The rule applies to classes that meet on this day or days.
            Enables flexibility so that if your school schedules their final exams based solely on
            whether a class meets on Monday, then you can only have 'M' in this array. On the other hand,
            if your school schedules final exams based on whether a class meets Monday and Wednesday, then you
            can have both 'M' and 'W' in this array. Each day is represented by a capital letter::

                Monday = M, Tuesday = T, Wednesday = W, Thursday = R, Friday = F
                
        start_time(str): The rule applies to classes that start at or after this time.
        end_time(str): The rule applies to classes that end at or before this time (Provided this is not a 'start-only' rule i.e. that
            only the time at which the class starts matters to whether the final exam matches or not.)
        result(str): The final exam time formatted as a string such as: "Monday, May 5th 12pm"
        start_only(bool): If true, the rule only needs to match the course's start time, not the start and end time.
        list_of_codes(str): The rule applies to classes with these course codes.
        code_regex(str): The rule applies if the course code matches a regex.
    
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
        If the final exam depends on both the start and end time (i.e. start_only is false) 
        and the start and end time do match up then returns true
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
