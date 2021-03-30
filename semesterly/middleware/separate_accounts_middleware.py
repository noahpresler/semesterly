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


from social_django.middleware import SocialAuthExceptionMiddleware
from social_core import exceptions as social_exceptions
from django.shortcuts import redirect

class SeparateAccountsSocialAuthExceptionMiddleware(
        SocialAuthExceptionMiddleware):
    def process_exception(self, request, exception):
        if isinstance(exception, social_exceptions.AuthAlreadyAssociated):
            return redirect('/separate_accounts/')
        else:
            return super(SeparateAccountsSocialAuthExceptionMiddleware, self
                         ).process_exception(request, exception)
