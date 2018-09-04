# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import re


class FinalExamScheduler:
    def __init__(self):
        self.list_of_rules = []
        self.s17 = []
        self.f17 = []
        self.s18 = []
        self.schedule = {}
        self.year = ""
        self.sem = ""

    def make_schedule(self, tt):
        '''
        Takes a timetable
        Returns a dictionary mapping each course code from the timetable to the final exam date/time
        for that course based on the rules of the scheduler.
        E.g.
            {
                'EN.600.440' : " Monday, May 5th 12pm",
                'EN.600.440' : " Monday, May 5th 12pm",
                'EN.600.440' : " Monday, May 5th 12pm"
            }
        '''
        semester = tt['courses'][0]["slots"][0]["semester"]
        self.year = semester["year"]
        self.sem = semester["name"]
        if self.year  == "2017" and self.sem == "Spring":
            self.list_of_rules = self.s17
        elif self.year  == "2017" and self.sem == "Fall":
            self.list_of_rules = self.f17
        else:
            self.list_of_rules = self.s18

        self.schedule = {}
        for course in tt['courses']:
            for rule in self.list_of_rules:
                result = rule.apply(course)

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
    def __init__(self, list_of_days=None, start_time=None, result=None, end_time="24:00",
                 start_only=False, list_of_codes=None, code_regex=None):
        self.list_of_days = list_of_days
        self.start_time = start_time
        self.end_time = end_time
        self.result = result
        self.start_only = start_only
        self.list_of_codes = list_of_codes
        self.code_regex = re.compile(code_regex) if code_regex else None

    def check_times(self, slot):
        return (not self.start_only and (
            int(slot['time_start'].split(':')[0]) >= int(self.start_time.split(':')[0]) and int(
                slot['time_end'].split(':')[0]) <= int(self.end_time.split(':')[0]))) | (
                   self.start_only and (
                       int(slot['time_start'].split(':')[0]) == int(self.start_time.split(':')[0])))

    def apply(self, course):
        if self.code_regex:
            if self.code_regex.match(course['code']):
                return self.result
        elif self.list_of_codes:
            if course['code'] in self.list_of_codes:
                return self.result
        else:
            filtered_slots = filter(lambda slot: slot['section_type'] == 'L', course['slots'])
            for slot in filtered_slots:
                if slot['day'] in self.list_of_days and self.check_times(slot):
                    return self.result
        return None

    def __repr__(self):
        return 'Days: {0], Start time: {1}, End Time {2}, Results: {3}'.format(
            self.list_of_days, self.start_time, self.end_time, self.result
        )