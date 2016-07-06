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
    if time.time() - start > 30:
      raise TimeoutException
    try:
      return code()
    except:
      continue

class TimeoutException(Exception):
  pass

def repeat_until_timeout(f):
  def _f(*args):
    """Keep trying to get a none None result from f until success or timeout."""
    start = time.time()
    while True:
      if time.time() - start > 30:
        raise TimeoutException
      result = f(*args)
      if result is not None:
        return result
  return _f