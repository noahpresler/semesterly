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
import traceback
api = API(locale='us')  

N_CLASSES = 16
django.setup()


'''#==========================================FOR PRODUCTION USE======================================
chrome_options = Options()
chrome_options.add_argument("--disable-extensions")

display=Display(visible=0, size=(800, 600))
display.start()

# If the Chrome Webdriver is not already in your $PATH, change this to 
# represent its filepath
WEBDRIVER_CHROME = '/root/chromedriver_executable/chromedriver' # e.g. '/home/linoah/chromedriver'
#====================================================================================================='''


#===========================================FOR DEVELOPMENT USE=======================================
WEBDRIVER_CHROME = '/home/linoah/chromedriver'
#=====================================================================================================


class HopkinsTextbookFinder: 

    def __init__(self):
        if not WEBDRIVER_CHROME:
            self.driver = webdriver.Chrome()
        else: 
            self.driver = webdriver.Chrome(WEBDRIVER_CHROME)
        self.driver.set_page_load_timeout(90)
        self.driver.set_script_timeout(90)
        self.s = requests.Session()
        self.isbn_pattern = pattern = re.compile(r"((?:97(?:8|9))?\d{9}(?:\d|X))$", re.MULTILINE)
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
                html = self.get_bn_html(request)
                self.parse_textbooks(html)
                if self.last_num_found == 0:
                    self.wait_retry(request)
                request='http://johns-hopkins.bncollege.com/webapp/wcs/stores/servlet/TBListView?storeId=18053&catalogId=10001&langId=-1&termMapping=N&courseXml=<?xml version="1.0" encoding="UTF-8"?><textbookorder><courses>'
                sleep(randint(5,20))
            else:
                request += self.course_tags[i]
        print "Parse Completed"
        self.driver.quit()
        print str(self.create_count) + " Textbooks Created | " + str(self.identified_count) + "Textbooks Identified, Not Created"

    def wait_retry(self,request):
        print "Retrying request..."
        sleep(randint(180,240))
        self.randomize_ua()
        html = self.get_bn_html(request)
        self.parse_textbooks(html) 

    def get_bn_html(self, url):
        while True:
            try:
                self.driver.get(url)
                break
            except: 
                print "retrying in 10 seconds"
                sleep(10)
        sleep(1)
        while True:
            try:
                results = self.driver.find_elements_by_class_name("book_sec")
                print len(results)
                if len(results) >= N_CLASSES -1 or (self.index == len(self.course_tags) - 1 and len(results) >= 1):
                    break
            except:
                sleep(.01)
        print "HTML recieved"
        return self.driver.page_source

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
        textbooks = soup.findAll('div', class_='book_details')
        self.last_num_found = len(textbooks)/2
        textbook_sections = soup.findAll('div',class_="book_sec")
        try:
            print "( Request #: " + str(int(self.index/N_CLASSES)) + ") " + str(len(textbooks)) + " textbooks found."
        except UnicodeEncodeError:
            pass
        for tbsec in textbook_sections:
            raw_code = tbsec.findAll('h1')[0]
            stripped_code = "".join(raw_code.get_text().split())[:8]
            course_code = stripped_code[:3] + "." + stripped_code[3:6]
            section = "(" + stripped_code[6:8] + ")"
            for tb in tbsec.findAll('div',class_="book_details"):
                match = re.findall(self.isbn_pattern,"".join(tb.get_text()))
                if len(match) > 0:
                    isbn_number = match[0]
                    is_required = self.check_required(tb.find('span', class_="recommendBookType").get_text())
                    self.make_textbook(is_required, isbn_number, course_code, section)
        try:
            print "\n"
        except UnicodeEncodeError:
            pass

    def make_textbook(self, is_required, isbn_number, course_code, section):
        course = HopkinsCourse.objects.filter(code__contains=course_code)[0]
        course_offerings = HopkinsCourseOffering.objects.filter(course=course,meeting_section = section)
        info = self.get_amazon_fields(isbn_number)

        # update/create textbook
        textbook_data = {
            'detail_url': info['DetailPageURL'],
            'image_url': info["ImageURL"],
            'author': info["Author"],
            'title': info["Title"]
        }
        textbook, created = Textbook.objects.update_or_create(isbn=isbn_number,
                                                        defaults=textbook_data)
        self.create_count += int(created)

        # link to all course offerings
        for co in course_offerings:
            if co.textbooks.filter(isbn=isbn_number).exists():
                continue
            new_link = HopkinsLink(courseoffering=co, textbook=textbook,
                            is_required=is_required)
            new_link.save()

        # print results
        if created:
            try:
                print "Textbook created: " + str(textbook.title)
            except UnicodeEncodeError:
                pass
        else:
            self.identified_count += 1
            try:
                print "Textbook found, not created: " + str(textbook.title)
            except UnicodeEncodeError:
                pass

    def get_detail_page(self,result):
        try:
            return smart_str(result.Items.Item.DetailPageURL)
        except:
            return "Cannot Be Found"

    def get_image_url(self,result):
        try:
            return smart_str(result.Items.Item.MediumImage.URL)
        except:
            return "Cannot Be Found"

    def get_author(self,result):
        try:
            return smart_str(result.Items.Item.ItemAttributes.Author)
        except:
            return "Cannot Be Found"

    def get_title(self,result):
        try:
            return smart_str(result.Items.Item.ItemAttributes.Title)
        except:
            return "Cannot Be Found"


    def get_amazon_fields(self,isbn):
        try:
            result = api.item_lookup(isbn.strip(), IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
            info = {
                "DetailPageURL" : self.get_detail_page(result),
                "ImageURL" : self.get_image_url(result),
                "Author" : self.get_author(result),
                "Title" : self.get_title(result)
            }
        except:
            import traceback
            traceback.print_exc()
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

