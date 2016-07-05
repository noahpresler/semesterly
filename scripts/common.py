import time

def parse_tz_time(time):
  """1:30PM -> 13:30, 11:30AM -> 11:30"""
  time_str = time[:-2]
  hour, minutes = time_str.split(':')
  new_hour = str(int(hour) + 12) if (time[-2:] == 'PM' and hour != '12') else hour
  return new_hour + ':' + minutes

def seleni_run(code):
  start = time.time()
  while True:
    if time.time() - start > 10:
      print time.time() - start
    if time.time() - start > 20:
      raise TimeoutException
    try:
      return code()
    except:
      continue

class TimeoutException(Exception):
  pass

