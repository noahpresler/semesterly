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

from __future__ import absolute_import, division, print_function

import signal
import socket

from selenium import webdriver

from parsing.common.peoplesoft.courses import QPeoplesoftParser
from semesterly.settings import get_secret


class Parser(QPeoplesoftParser):
    """Course parser for Queens University."""

    URL = 'https://saself.ps.queensu.ca/psc/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL'

    def __new__(cls, *args, **kwargs):
        """Set static variables within closure.

        Returns:
            Parser
        """
        new_instance = object.__new__(cls)
        cls.CREDENTIALS = {
            'USERNAME': get_secret('QUEENS_USER'),
            'PASSWORD': get_secret('QUEENS_PASS')
        }
        return new_instance

    def __init__(self, **kwargs):
        """Construct parsing object."""
        params = {
            'Page': 'SSR_CLSRCH_ENTRY',
            'Action': 'U',
            'ExactKeys': 'Y',
            'TargetFrameName': 'None'
        }
        self.cap = webdriver.DesiredCapabilities.PHANTOMJS
        self.cap["phantomjs.page.settings.resourceTimeout"] = 50000000
        self.cap["phantomjs.page.settings.loadImages"] = False
        self.cap["phantomjs.page.settings.userAgent"] = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:16.0) Gecko/20121026 Firefox/16.0'
        try:
            self.driver = webdriver.PhantomJS(desired_capabilities=self.cap)
        except AttributeError:
            # NOTE: comment being saved in case this is important for local dev.
            self.driver = webdriver.PhantomJS(
                './node_modules/phantomjs/bin/phantomjs',
                desired_capabilities=self.cap
            )
        # self.driver = webdriver.Chrome()  # FOR DEBUG PURPOSES ONLY

        super(Parser, self).__init__('queens', Parser.URL,
                                     url_params=params, **kwargs)

    def seleni_run(self, execute):
        """Run selenium routine."""
        while True:
            try:
                return execute()
            except:
                continue

    def login(self):
        """Login to Queens course listings website."""
        socket.setdefaulttimeout(60)
        self.driver.set_page_load_timeout(30)
        self.driver.implicitly_wait(30)
        self.driver.get('https://my.queensu.ca/')
        self.seleni_run(
            lambda: self.driver.find_element_by_id('username').send_keys(
                Parser.CREDENTIALS['USERNAME']
            )
        )
        self.seleni_run(
            lambda: self.driver.find_element_by_id('password').send_keys(
                Parser.CREDENTIALS['PASSWORD']
            )
        )
        self.seleni_run(
            lambda: self.driver.find_element_by_class_name('form-button').click()
        )
        self.seleni_run(
            lambda: self.driver.find_element_by_link_text("SOLUS").click()
        )

        # Focus iframe
        iframe = self.seleni_run(
            lambda: self.driver.find_element_by_xpath(
                "//iframe[@id='ptifrmtgtframe']"
            )
        )
        self.driver.switch_to_frame(iframe)

        self.seleni_run(
            lambda: self.driver.find_element_by_link_text("Search").click()
        )

        # transfer Selenium cookies to Requester cookies
        for cookie in self.driver.get_cookies():
            c = {cookie['name']: cookie['value']}
            self.requester.session.cookies.update(c)

        # Close Selenium/PhantomJS process.
        # REF: http://stackoverflow.com/questions/25110624/how-to-properly-stop-phantomjs-execution
        # NOTE: update selenium version after fix released
        #  (https://github.com/hydroshare/hydroshare/commit/f7ef2a867250aac86b3fd12821cabf5524c2cb17)
        self.driver.close()
        self.driver.service.process.send_signal(signal.SIGTERM)
        self.driver.quit()

        headers = {
            'Pragma': 'no-cache',
            'Accept-Encoding': 'gzip, deflate, sdch, br',
            'Accept-Language': 'en-US,en;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Referer': 'https://saself.ps.queensu.ca/psc/saself/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?PortalActualURL=https%3a%2f%2fsaself.ps.queensu.ca%2fpsc%2fsaself%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentURL=https%3a%2f%2fsaself.ps.queensu.ca%2fpsc%2fsaself%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fsaself.ps.queensu.ca%2fpsp%2fsaself%2f&PortalURI=https%3a%2f%2fsaself.ps.queensu.ca%2fpsc%2fsaself%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        }

        self.requester.headers = headers

        # NOTE: get request will update CookieJar
        self.requester.get(Parser.URL, params={
            'Page': 'SSR_CLSRCH_ENTRY',
            'Action': 'U',
            'ExactKeys': 'Y',
            'TargetFrameName': 'None'
        })

    def start(self, verbosity=3, **kwargs):
        """Start parse."""
        self.login()
        super(Parser, self).start(verbosity=verbosity, **kwargs)
