# @what     Parsing library HTTP Requester
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/21/16

import os, datetime, requests, cookielib, re, sys
from fake_useragent import UserAgent
from bs4 import BeautifulSoup

class Requester:

    def __init__(self):
        self.session = requests.Session()
        self.headers = {'User-Agent' : 'UserAgent 1.0'} # UserAgent().random
        self.cookies = cookielib.CookieJar()

    def get(self, url, params=None, parser=None, quiet=True):
        ''' HTTP GET.

        Args:
            url (str): url to query
            params (dict): payload dictionary of HTTP params (default None)
            quiet (bool): suppress output if True (default True)
            parser (None, bool, str): specifies if return should be transformed into soup (default None)
                str option specifies soup parse type

        Returns:
            request object: if parser is set None or False
            soup: soupified text of http request

        Examples:
            TODO
        '''
        r = None
        while r is None:
            try:
                r = self.session.get(
                    url,
                    params = params if params else '',
                    cookies = self.cookies,
                    headers = self.headers,
                    verify = True
                )

                if not quiet:
                    print 'GET', r, r.url

            except (requests.exceptions.Timeout,
                requests.exceptions.ConnectionError):
                sys.stderr.write("Timeout error: (GET) " + str(sys.exc_info()[0]) + '\n')
                raw_input("Press Enter to try again...")
                r = None
        
        if not parser:
            return r
        else:
            return Requester.soupify(r, parser)

    def post(self, url, form=None, params=None, parser=None, quiet=True):
        ''' HTTP POST.

        Args:
            url (str): url to query
            form (dict): HTTP form key-value dictionary (defualt None)
            params (dict): payload dictionary of HTTP params 
            quiet (bool): suppress output if True (default True)
            parser (None, bool, str): specifies if return should be transformed into soup (default None)
                str option specifies soup parse type

        Returns:
            request object: if parser is None or False
            soup: soupified text of http request

        Examples:
            TODO
        '''
        r = None
        while r is None:
            try:
                r = self.session.post(
                    url,
                    data = form if form else '',
                    params = params if params else '',
                    cookies = self.cookies,
                    headers = self.headers,
                    verify = True,
                )

                if not quiet:
                    print 'POST', r.url

            except (requests.exceptions.Timeout,
                requests.exceptions.ConnectionError):
                sys.stderr.write("Unexpected error POST: " + str(sys.exc_info()[0]) + '\n')
                raw_input("Press Enter to try again...")
                r = None

        if not parser:
            return r
        else:
            return Requester.soupify(r, parser)

    @staticmethod
    def soupify(request, parser):
        parser = parser if isinstance(parser, basestring) else 'html.parser'
        return BeautifulSoup(request.text, parser)
