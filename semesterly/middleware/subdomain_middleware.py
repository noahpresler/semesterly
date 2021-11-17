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

from django.utils.deprecation import MiddlewareMixin
from parsing.schools.active import ACTIVE_SCHOOLS


class SubdomainMiddleware(MiddlewareMixin):
	def process_request(self, request):

		# Define domain suffixes for non-prod environments
		nonprod_suffixes = ("-dev","-test","-stage","-prod","sem")
		# Define domain suffixes for prod environments
		prod_suffixes = ("semester")

		if 'HTTP_X_ORIGINAL_HOST' in request.META:
			subdomain = request.META.get('HTTP_X_ORIGINAL_HOST', '')
		else:
			subdomain = request.META.get('HTTP_HOST', '')

		subdomain = subdomain.split('.')[0].strip().lower()

		if subdomain in ACTIVE_SCHOOLS:
			request.subdomain = subdomain
		elif subdomain.endswith(nonprod_suffixes):
			# DO NOT default to JHU for non-prod URLs for ease of setup/testing
			request.subdomain = None
		elif subdomain in (prod_suffixes):
			request.subdomain = None
		else:
			request.subdomain = None
