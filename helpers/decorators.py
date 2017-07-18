from functools import wraps

from django.shortcuts import render

from timetable.school_mappers import VALID_SCHOOLS


def validate_subdomain(view_func):
    """
    Validates subdomain, redirecting user to 
    index iof the school is invalid.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.subdomain not in VALID_SCHOOLS:
            return render(request, 'index.html')
        else:
            return view_func(request, *args, **kwargs)

    # mark function for testing
    wrapper.func_dict['requires_subdomain'] = True
    return wrapper