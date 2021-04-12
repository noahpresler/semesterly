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

# from django.test import TestCase
# from rest_framework import status, exceptions
# from django.http import HttpResponse
# from rest_framework.authentication import get_authorization_header, BaseAuthentication
# from users.models import User
# import jwt
# import json

# TODO: Write tests for advising app.
# class TokenAuthentication(BaseAuthentication):
#     def authenticate_credentials(self):
#         try:
#             payload = jwt.decode(get_secret('STUDENT_SIS_AUTH_SECRET'), get_secret('STUDENT_SIS_AUTH_SECRET'), algorithms=['HS256'])
#             if payload == "null":
#                 msg = 'Null token not allowed'
#                 raise exceptions.AuthenticationFailed(msg)
#         except jwt.ExpiredSignature or jwt.DecodeError or jwt.InvalidTokenError:
#             return HttpResponse({'Error': "Token is invalid"}, status="403")
#         except UnicodeError:
#             msg = 'Invalid token header. Token string should not contain invalid characters.'
#             raise exceptions.AuthenticationFailed(msg)
#         print(payload)
#         return payload

#     # ensure json data returned is correct format
#     def validate_payload(self): 

