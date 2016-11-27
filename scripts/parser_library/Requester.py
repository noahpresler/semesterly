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

    def get(self, url, params=None, parse=True, quiet=True):
        ''' HTTP GET.

        Args:
            url (str): url to query
            params (dict): payload dictionary of HTTP params (default None)
            quiet (bool): suppress output if True (default True)
            parse (bool): specifies if return should be transformed into soup (default False)
                autodetects parse type as 'html.parser' or 'lxml'

        Returns:
            request object: if parse is False
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

        if not parse:
            return r

        soup = Requester.soupify(r.text)
        if soup:
            return soup
        else:
            return r

    def post(self, url, form=None, params=None, parse=True, quiet=True):
        ''' HTTP POST.

        Args:
            url (str): url to query
            form (dict): HTTP form key-value dictionary (defualt None)
            params (dict): payload dictionary of HTTP params 
            quiet (bool): suppress output if True (default True)
            parse (bool): specifies if return should be transformed into soup (default False)
                autodetects parse type as 'html.parser' or 'lxml'

        Returns:
            request object: if parse is False
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

        if not parse:
            return r

        soup = Requester.soupify(r.text)
        if soup:
            return soup
        else:
            return r

    @staticmethod
    def soupify(markup):
        ''' Soupifies markup of given request. Additionally, autodects html or xml format.

        Args:
            markup: raw markup text

        Returns:
            soupified markup
        '''
        if markup is None:
            return None
        soup = lambda parser: BeautifulSoup(markup, parser)
        if "</html>"[::-1] in markup[::-1]:
        # NOTE: ^quite inefficient so do fun things w/reversals :-)
            return soup('html.parser')
        else:
            return soup('lxml')
