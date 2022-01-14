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

import time
from selenium.common.exceptions import TimeoutException

def parse_tz_time(time):
  """1:30PM -> 13:30, 11:30AM -> 11:30"""
  time_str = time[:-2]
  hour, minutes = time_str.split(':')
  new_hour = str(int(hour) + 12) if (time[-2:] == 'PM' and hour != '12') else hour
  return new_hour + ':' + minutes

def parse_range_time(time):
  """'1-3' -> ('13:00', '15:00'), '9' -> ('9:00', '10:00')"""
  if '-' in time:
    start, end = list(map(convert_to_24, time.split('-')))
  else:
    start = convert_to_24(time)
    end = str(int(start) + 1)
  return start + ':00', end + ':00'

def seleni_run(code):
  start = time.time()
  while True:
    if time.time() - start > 15:
      raise TimeoutException
    try:
      return code()
    except:
      continue

def repeat_until_timeout(f):
  def _f(*args):
    """Keep trying to get a none None result from f until success or timeout."""
    start = time.time()
    while True:
      if time.time() - start > 15:
        raise TimeoutException
      result = f(*args)
      if result is not None:
        return result
  return _f

def convert_to_24(time):
  """ Assumes normal class hours. 1 -> 13, 9 -> 9, 10 -> 10, 7 -> 19. etc."""
  hour, minute = get_hours_minutes(time)
  if 1 <= int(hour) <= 7:
    return str(int(hour) + 12) + minute
  else:
    return hour + minute

def add_time(time):
  """ 11 -> 12, 11:30 -> 12:30 """
  hour, minute = get_hours_minutes(time)
  return convert_to_24(str(int(hour) + 1) + minute)

def get_hours_minutes(time):
  """ Safely get hours minutes, even if time has no minutes, e.g. 10 """
  if ':' in time:
    h, m = time.split(':')
    return h, ':' + m
  else:
    return time, ''
