# @what     Parsing library HTTP Requester
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     3/5/17

from __future__ import print_function # NOTE: slowly move toward Python3

import os, datetime, requests, cookielib, re, sys, interruptingcow
from fake_useragent import UserAgent
from bs4 import BeautifulSoup

class Requester:

    def __init__(self):
        self.session = requests.Session()
        self.headers = {'User-Agent': UserAgent().random}
        self.cookies = cookielib.CookieJar() # TODO - maybe this is not needed

    def new_user_agent(self):
        self.headers['User-Agent'] = UserAgent().random

    def overwrite_header(self, new_headers):
        self.headers = new_headers

    def http_request(self, do_http_request, type,  parse=True, quiet=True, timeout=30, throttle=(lambda: None)):
        ''' Perform HTTP Request.
        Args:
            do_http_request: function that returns request object
        Kwargs:
            quiet (bool): suppress output if True (default True)
            parse (bool): specifies if return should be transformed into soup (default False)
                autodetects parse type as 'html.parser' or 'lxml'
        Returns:
            request object: if parse is False
            soup: soupified/jsonified text of http request
        '''
        response = None
        for i in range(10):
            try:
                with interruptingcow.timeout(timeout, exception=requests.exceptions.Timeout):
                    response = do_http_request()
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                if i > 1:
                    sys.stderr.write('THROTTLING REQUESTER') # TODO - should not be stderr, maybe warning?
                    throttle()
                sys.stderr.write("Requester error: " + str(sys.exc_info()[0]) + '\n')
                continue

            if response is not None:
                break

            if i > 1:
                sys.stderr.write('THROTTLING REQUESTER') # TODO - should not be stderr, maybe warning?
                throttle()

        if not quiet:
            print(type, response.url)

        if not parse:
            return response

        soup = Requester.markup(response)
        if soup or soup == []:
            return soup
        else:
            return response

    def get(self, url, params=None, **kwargs):
        ''' HTTP GET.

        Args:
            url (str): url to query
            params (dict): payload dictionary of HTTP params (default None)
            quiet (bool): suppress output if True (default True)
            parse (bool): specifies if return should be transformed into soup (default False)
                autodetects parse type as 'html.parser' or 'lxml'

        Returns:
            request object: if parse is False
            soup: soupified/jsonified text of http request

        Examples:
            TODO
        '''
        request = lambda: self.session.get(
                url,
                params = params if params else '',
                cookies = self.cookies,
                headers = self.headers,
                verify = False,
            )

        return self.http_request(request, 'GET', **kwargs)

    def post(self, url, form=None, params=None, data=None, **kwargs):
        ''' HTTP POST.

        Args:
            url (str): url to query
            form (dict): HTTP form key-value dictionary (defualt None)
            params (dict): payload dictionary of HTTP params 

        Returns:
            request object: if parse is False
            soup: soupified/jsonified text of http request
        '''
        request = lambda: self.session.post(
                url,
                data = data if data else form if form else '', # TODO - change form to data
                params = params if params else '',
                cookies = self.cookies,
                headers = self.headers,
                verify = False,
            )
        return self.http_request(request, 'POST', **kwargs)

    @staticmethod
    def markup(response):
        '''Autodects html, json, or xml format in response.

        Args:
            response: raw response object

        Returns:
            markedup response
        '''
        if response is None:
            return None
        soupify = lambda parser: BeautifulSoup(response.text, parser)
        try:
            return response.json()
        except ValueError:
            pass
        if "</html>"[::-1] in response.text[::-1]:
            return soupify('html.parser')
        else:
            return soupify('lxml')
