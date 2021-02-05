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

from functools import wraps

from django.shortcuts import render

from parsing.schools.active import ACTIVE_SCHOOLS


def validate_subdomain(view_func):
    """
    Validates subdomain, redirecting user to
    index iof the school is invalid.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.subdomain not in ACTIVE_SCHOOLS:
            return render(request, 'index.html')
        else:
            return view_func(request, *args, **kwargs)

    # mark function for testing
    wrapper.__dict__['requires_subdomain'] = True
    return wrapper