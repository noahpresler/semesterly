from selenium import webdriver
from time import sleep
import sys
import json
import requests, cookielib
import os
import sys
import django
from toolz import itertoolz
from collections import OrderedDict
import re
import urllib2
from selenium.webdriver.support.ui import Select
from timetable.models import *
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
from random import randint
import smtplib
from email.mime.text import MIMEText
from timeout import timeout
import errno
from django.utils.encoding import smart_str, smart_unicode
from fake_useragent import UserAgent
from amazonproduct import API
api = API(locale='us')


N_CLASSES = 99
django.setup()


class HopkinsTextbookFinder: 

    def __init__(self):
        self.s = requests.Session()
        self.isbn_pattern = pattern = re.compile(r"ISBN:((?:97(?:8|9))?\d{9}(?:\d|X))$", re.MULTILINE)
        self.code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
        self.cookies = cookielib.CookieJar()
        self.create_count = 0
        self.identified_count = 0
        self.semester = None
        self.course_codes = None
        self.ua = UserAgent()
        self.last_num_found = 0
        self.headers = {
            'User-Agent': 'My User Agent 1.0'
        }
        self.index = 0

    def randomize_ua(self):
        self.headers = {
            'User-Agent': self.ua.random
        }

    def parse_classes(self):
        self.course_tags = self.remove_duplicates(self.get_course_tags()) 
        self.find_textbooks()

    def find_textbooks(self):
        request='http://johns-hopkins.bncollege.com/webapp/wcs/stores/servlet/TBListView?storeId=18053&catalogId=10001&langId=-1&termMapping=N&courseXml=<?xml version="1.0" encoding="UTF-8"?><textbookorder><courses>'
        for i in range(len(self.course_tags)):
            self.index = i
            if i > 1 and (i % N_CLASSES == 0 or i == len(self.course_tags) - 1):
                request += '</courses></textbookorder>'
                self.randomize_ua()
                f = open('workfile.html', 'w')
                html = self.get_bn_html(request)
                f.write(html)
                f.close()
                self.parse_textbooks(html)
                if self.last_num_found == 0:
                    self.wait_retry(request)
                request='http://johns-hopkins.bncollege.com/webapp/wcs/stores/servlet/TBListView?storeId=18053&catalogId=10001&langId=-1&termMapping=N&courseXml=<?xml version="1.0" encoding="UTF-8"?><textbookorder><courses>'
                sleep(randint(20,45))
            else:
                request += self.course_tags[i]
        print "Parse Completed"
        print str(self.create_count) + " Textbooks Created | " + str(self.identified_count) + "Textbooks Identified, Not Created"

    def wait_retry(self,request):
        print "Retrying request..."
        sleep(randint(180,240))
        self.randomize_ua()
        f = open('workfile.html', 'w')
        html = self.get_bn_html(request)
        f.write(html)
        f.close()
        self.parse_textbooks(html)

    def get_bn_html(self, url):
        html = None
        while html is None:
            try:
                r = self.s.get(url,cookies=self.cookies,headers=self.headers)
                if r.status_code == 200:
                    html = r.text
            except (requests.exceptions.Timeout,
                    requests.exceptions.ConnectionError):
                continue
        return html.encode('utf-8')

    def remove_duplicates(self,l):
        return list(set(l))

    def get_course_tags(self):
        all_course_offerings = HopkinsCourseOffering.objects.all()
        all_course_codes = []
        for c in all_course_offerings:
            all_course_codes.append(c.get_course_tag())
        return all_course_codes

    def parse_textbooks(self,html):
        soup = BeautifulSoup(html)
        textbooks = soup.findAll('li', class_='book_c2')
        self.last_num_found = len(textbooks)/2
        try:
            print "( Request #: " + str(int(self.index/N_CLASSES)) + ") " + str(len(textbooks)/2) + " textbooks found."
        except UnicodeEncodeError:
            pass
        for tb in textbooks:
            match = re.findall(self.isbn_pattern,"".join(tb.get_text().split()))
            if len(match) > 0:
                isbn_number = match[0]
                is_required = self.check_required(tb.parent.parent.find(class_='recommendBookType'))
                self.make_textbook(tb.parent.parent.parent.parent.parent.parent,is_required,isbn_number)
        try:
            print "\n"
        except UnicodeEncodeError:
            pass

    def make_textbook(self,parent,is_required,isbn_number):
        raw_code = parent.findAll('h1')[0]
        stripped_code = "".join(raw_code.get_text().split())[:8]
        course_code = stripped_code[:3] + "." + stripped_code[3:6]
        section = "(" + stripped_code[6:8] + ")"
        course = HopkinsCourse.objects.filter(code__contains=course_code)[0]
        course_offerings = HopkinsCourseOffering.objects.filter(course=course,meeting_section = section)
        textbook = None
        for co in course_offerings:
            try:
                textbook = co.textbooks.get(isbn=isbn_number)
            except:
                pass
        if textbook is None:
            info = self.get_amazon_fields(isbn_number)
            textbook = HopkinsTextbook(
                isbn = isbn_number,
                is_required = is_required,
                detail_url = info['DetailPageURL'],
                image_url = info["ImageURL"],
                author = info["Author"],
                title = info["Title"])
            textbook.save()
            self.create_count +=1
            try:
                print "Textbook created: " + str(textbook)
            except UnicodeEncodeError:
                pass
        else:
            self.identified_count += 1
            try:
                print "Textbook found, not created: " + str(textbook)
            except UnicodeEncodeError:
                pass
        for co in course_offerings:
            if not co.textbooks.filter(isbn=isbn_number).exists():
                co.textbooks.add(textbook)
                co.save()

    def get_amazon_fields(self,isbn):
        try:
            result = api.item_lookup(isbn, IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
            info = {
                "DetailPageURL" : smart_str(result.Items.Item.DetailPageURL),
                "ImageURL" : smart_str(result.Items.Item.MediumImage.URL),
                "Author" : smart_str(result.Items.Item.ItemAttributes.Author),
                "Title" : smart_str(result.Items.Item.ItemAttributes.Title)
            }
        except:
            info = {
                "DetailPageURL" : "Cannot be found",
                "ImageURL" : "Cannot be found",
                "Author" : "Cannot be found",
                "Title" : "Cannot be found"
            }
        return info

    def check_required(self,html):
        if html.find("REQUIRED") != -1:
            return True
        else:
            return False

cf = HopkinsTextbookFinder()
cf.parse_classes()

