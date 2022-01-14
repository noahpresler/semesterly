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

import requests
import http.cookiejar
import sys
import interruptingcow

from fake_useragent import UserAgent
from bs4 import BeautifulSoup


class Requester:

    def __init__(self):
        self.session = requests.Session()
        self.headers = {'User-Agent': UserAgent().random}
        self.cookies = http.cookiejar.CookieJar()  # TODO - maybe this is not needed

    def new_user_agent(self):
        self.headers['User-Agent'] = UserAgent().random

    def overwrite_header(self, new_headers):
        self.headers = new_headers

    def http_request(self, do_http_request, type, parse=True, quiet=True, timeout=60, throttle=(lambda: None)):
        """Perform HTTP request.

        Args:
            do_http_request: function that returns request object
            type (str): GET, POST, HEAD
            parse (bool, optional): Specifies if return should be parsed.
                Autodetects parse type as html, xml, or json.
            quiet (bool, optional): suppress output if True (default True)
            timeout (int, optional): Description
            throttle (lambda, optional): Description

        Returns:
            request object: if parse is False
            soup: soupified/jsonified text of http request
        """
        response = None
        for i in range(10):
            try:
                with interruptingcow.timeout(timeout, exception=requests.exceptions.Timeout):
                    response = do_http_request()
            except (requests.exceptions.Timeout,
                    requests.exceptions.ConnectionError):
                if i > 1:
                    print('THROTTLING REQUESTER', file=sys.stderr)  # TODO - should not be stderr, maybe warning?
                    throttle()
                print("Requester error:",
                      str(sys.exc_info()[0]),
                      file=sys.stderr)
                self.new_user_agent()
                continue

            if response is not None:
                break

            if i > 1:
                print('THROTTLING REQUESTER', file=sys.stderr)  # TODO - should not be stderr, maybe warning?
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

    def get(self, url,
            params='',
            session=None,
            cookies=None,
            headers=None,
            verify=True,
            **kwargs):
        """HTTP GET.

        Args:
            url (str): url to query
            params (dict): payload dictionary of HTTP params (default None)
            cookies (None, optional): Description
            headers (None, optional): Description
            verify (bool, optional): Description
            **kwargs: Description

        Examples:
            TODO
        """
        def request():
            return self.session.get(
                url,
                params=params,
                cookies=self.cookies,
                headers=headers if headers is not None else self.headers,
                verify=verify,
            )

        return self.http_request(request, 'GET', **kwargs)

    def post(self, url,
             data='',
             params='',
             cookies=None,
             headers=None,
             verify=True,
             **kwargs):
        """HTTP POST.

        Args:
            url (str): url to query
            data (str, optional): HTTP form key-value dictionary
            params (dict): payload dictionary of HTTP params
            cookies (None, optional): Description
            headers (None, optional): Description
            verify (bool, optional): Description
            **kwargs: Description
        """
        def request():
            return self.session.post(
                url,
                data=data,
                params=params,
                cookies=self.cookies,
                headers=headers if headers is not None else self.headers,
                verify=verify,
            )

        return self.http_request(request, 'POST', **kwargs)

    @staticmethod
    def markup(response):
        """Autodects html, json, or xml format in response.

        Args:
            response: raw response object

        Returns:
            markedup response
        """
        def soupify(parser):
            return BeautifulSoup(response.text, parser)
        if response is None:
            return None
        try:
            return response.json()
        except ValueError:
            pass
        if "</html>"[::-1] in response.text[::-1]:
            return soupify('html.parser')
        else:
            return soupify('lxml')
