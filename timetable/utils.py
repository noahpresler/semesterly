from school_mappers import VALID_SCHOOLS
from django.shortcuts import render

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
