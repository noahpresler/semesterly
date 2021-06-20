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

# tip: timetables with lowest cost get shown first -> metrics should return
# lower numbers for "better" timetables. timetable: [cid, sid, [offerings]]
from pprint import pprint
from timetable.models import *

def get_tt_cost(tt, sort_params):
  return tuple([metric(tt.stats) for metric in map(metric_to_stat.get, sort_params)])

# TODO
def get_num_friends(timetable):
  return 0

def get_num_conflicts(timetable):
  pass

def get_num_days(day_to_usage):
  got_class = [any(usage)for usage in list(day_to_usage.values())]
  return sum(got_class)

def get_avg_rating(timetable):
  courses = set(slot.course for slot in timetable)
  # TODO: consolidate with TimetableSerializer.get_avg_rating()
  ratings_by_course = (course.get_avg_rating() for course in courses)
  valid_ratings = [rating for rating in ratings_by_course if 0 <= rating <= 5]
  return float(sum(valid_ratings)) / len(valid_ratings) if valid_ratings else 0

def get_avg_day_length(day_to_usage):
  lengths = [get_day_length(usage) for usage in list(day_to_usage.values())]
  return sum(lengths)/float(len(lengths))

def get_day_length(usage):
  has_class = ''.join(['T' if offering_set else 'F' for offering_set in usage])
  day_start = has_class.find('T')
  day_end = len(has_class) - has_class[::-1].find('T')
  return day_end - day_start

metric_to_stat = {
  ('sections with friends', 'most'): lambda stats: -stats['num_friends'],
  ('sections with friends', 'least'): lambda stats: stats['num_friends'],
  ('number of conflicts', 'least'): lambda stats: -stats['num_conflicts'],
  ('number of conflicts', 'most'): lambda stats: stats['num_conflicts'],
  ('days with class', 'least'): lambda stats: stats['days_with_class'],
  ('days with class', 'most'): lambda stats: -stats['days_with_class'],
  ('course rating stars', 'most'): lambda stats: -stats['avg_rating'],
  ('course rating stars', 'least'): lambda stats: stats['avg_rating'],
  ('time on campus', 'most'): lambda stats: -stats['time_on_campus'],
  ('time on campus', 'least'): lambda stats: stats['time_on_campus'],
}
