def parse_tz_time(time):
  """1:30PM -> 13:30, 11:30AM -> 11:30"""
  time_str = time[:-2]
  hour, minutes = time_str.split(':')
  new_hour = str(int(hour) + 12) if time[-2:] == 'PM' and hour != '12'
  return new_hour + ':' + minutes
