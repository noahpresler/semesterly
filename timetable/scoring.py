# tip: timetables with lowest cost get shown first -> metrics should return
# lower numbers for "better" timetables

def get_tt_cost(timetable, sort_params):
  return tuple([metric(timetable) for metric in map(str_to_func.get, sort_params)])

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
  'by_most_friends': reverse_metric(get_num_friends),
  'by_least_friends': get_num_friends,
  'by_least_conflicts': reverse_metric(get_num_conflicts),
  'by_most_days_off': get_num_days,
  'by_least_days_off': reverse_metric(get_num_days),
  'by_rating': reverse_metric(get_average_rating),
  'by_time_on_campus': reverse_metric(get_day_length),
  'by_time_off_campus': get_day_length,
}
