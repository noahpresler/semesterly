# tip: timetables with lowest cost get shown first -> metrics should return
# lower numbers for "better" timetables. timetable: [cid, sid, [offerings]]
from pprint import pprint

def get_tt_cost(timetable, sort_params):
  pprint(timetable)
  return 0
  # return tuple([metric(timetable) for metric in map(str_to_func.get, sort_params)])

def reverse_metric(metric):
  def _reversed(timetable):
    return -metric(timetable)
  return _reversed

def get_num_friends(timetable):
  pass

def get_num_conflicts(timetable):
  pass

def get_num_days(timetable):
  pass

def get_average_rating(timetable):
  pass

def get_day_length(timetable):
  pass

str_to_func = {
  ('sections with friends', 'most'): reverse_metric(get_num_friends),
  ('sections with friends', 'least'): get_num_friends,
  ('number of conflicts', 'least'): reverse_metric(get_num_conflicts),
  ('number of conflicts', 'most'): get_num_conflicts,
  ('days with class', 'least'): get_num_days,
  ('days with class', 'most'): reverse_metric(get_num_days),
  ('course rating stars', 'most'): reverse_metric(get_average_rating),
  ('course rating stars', 'least'): get_average_rating,
  ('time on campus', 'most'): reverse_metric(get_day_length),
  ('time on campus', 'least'): get_day_length,
}
