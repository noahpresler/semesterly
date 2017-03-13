from collections import namedtuple
from datetime import datetime
from functools import wraps

from school_mappers import VALID_SCHOOLS
from django.shortcuts import render


def timed_cache(timeout):
  """ 
  Return a decorator which memoizes a function, clearing its cache every 
  timeout days.
  """
  def cache_decorator(f):
    # use dict to get around python 2 non local behaviour
    variables = {
      'cache': {},
      'last_flush_time': datetime.now()
    }
    def _f(*args):
      if (datetime.now() - variables['last_flush_time']).days > timeout:
        variables['cache'] = {}
        variables['last_flush_time'] = datetime.now()
      try:
        return variables['cache'][args]
      except KeyError:
        variables['cache'][args] = result = f(*args)
        return result
    return _f
  return cache_decorator

def validate_subdomain(view_func):
  def wrapper(request, *args, **kwargs):
    if request.subdomain not in VALID_SCHOOLS:
      return render(request, 'index.html')
    else:
      return view_func(request, *args, **kwargs)
  return wrapper

def merge_dicts(d1, d2):
  d = d1.copy()
  d.update(d2)
  return d
