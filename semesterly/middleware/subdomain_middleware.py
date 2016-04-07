from timetable.school_mappers import VALID_SCHOOLS
class SubdomainMiddleware(object):
	def process_request(self, request):
		subdomain = request.META.get('HTTP_HOST', '')\
					.split('.')[0]\
					.strip()\
					.lower()
		if subdomain in VALID_SCHOOLS:
			request.subdomain = subdomain
		else:
			request.subdomain = None
