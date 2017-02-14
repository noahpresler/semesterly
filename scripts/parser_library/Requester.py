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
                # raw_input("Press Enter to try again...")
                r = None

        if not parse:
            return r

        soup = Requester.markup(r)
        if soup or soup == []:
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
                    data = form if form else '', # TODO - change form to data
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
                # raw_input("Press Enter to try again...")
                r = None

        if not parse:
            return r

        soup = Requester.markup(r)
        if soup or soup == []:
            return soup
        else:
            return r

    @staticmethod
    def markup(response):
        ''' Marks up response of given response. Additionally, autodects html, json, or xml format.

        Args:
            response: raw response object

        Returns:
            markedup response
        '''
        if response is None:
            return None
        soup = lambda parser: BeautifulSoup(response.text, parser)
        try:
            return response.json()
        except ValueError:
            pass
        if "</html>"[::-1] in response.text[::-1]:
            return soup('html.parser')
        else:
            return soup('lxml')
