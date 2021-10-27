class MultipleProxyMiddleware:
    FORWARDED_FOR_FIELDS = [
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_FORWARDED_HOST',
        'HTTP_X_FORWARDED_SERVER',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        """
        Rewrites the proxy headers so that only the most
        recent proxy is used.
        """
        for field in self.FORWARDED_FOR_FIELDS:
            if field in request.META:
                if ',' in request.META[field]:
                    parts = request.META[field].split(',')
                    request.META[field] = parts[-1].strip()

        """
        Rewrites the X Original Host to X Forwarded Host header
        """
        if 'HTTP_X_ORIGINAL_HOST' in request.META:
            request.META['HTTP_X_FORWARDED_HOST'] = request.META['HTTP_X_ORIGINAL_HOST']

        return self.get_response(request)
