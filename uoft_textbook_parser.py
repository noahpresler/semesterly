import os, sys, re, django
from amazonproduct import API
from amazonproduct.errors import *
from bs4 import BeautifulSoup
from django.db.models import Q
from django.utils.encoding import smart_str, smart_unicode
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from time import sleep

api = API(locale='us')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from timetable.models import *
WEBDRIVER_CHROME = '/Users/rohandas/Desktop/chromedriver' # e.g. '/home/linoah/chromedriver'


class UofTTextbookParser:
    def __init__(self):

        if not WEBDRIVER_CHROME:
            self.driver = webdriver.Chrome()
        else: 
            self.driver = webdriver.Chrome(WEBDRIVER_CHROME)
    
        self.semester = "S"
        self.batch_size = 200    
        self.load_timeout = int(self.batch_size/3)
        self.driver.set_page_load_timeout(self.load_timeout)
        self.driver.set_script_timeout(self.load_timeout)
        self.textbooks_found_count = 0
        self.error_count = 0
        st_george_courses = Course.objects.filter(code__endswith="1").order_by('code')


        self.driver.get("http://uoftbookstore.com/buy_courselisting.asp")


        school_selector = Select(self.driver.find_element_by_id("fTerm"))
        self.select_by_partial_text("ST GEORGE", school_selector)

        sleep(1.5)
        for course in st_george_courses:
            print "Trying", course.code
            dept_selector = Select(self.driver.find_element_by_id("fDept"))
            self.select_by_partial_text(course.get_dept() + "-", dept_selector)
            course_selector = Select(self.driver.find_element_by_id("fCourse"))
            self.select_by_partial_text(course.code, course_selector)

            for section in self.get_all_sections(course):
                course_selector = Select(self.driver.find_element_by_id("fSection"))
                if not self.select_by_partial_text(section, course_selector, 1):
                    continue
                print "\t Found valid section:" + section
                books_element = self.driver.find_element_by_id("course-bookdisplay")
                sleep(1)
                self.parse_results(books_element.get_attribute('outerHTML'))
                

        print "Done all! Found %d textbooks in total." % (self.textbooks_found_count)


    def parse_results(self, source):
        soup = BeautifulSoup(source)
        page_source = soup.find(id="course-bookdisplay")

        section_headers = page_source.find_all("h3") # of all of these headers, we'll need to filter out the ones
        # that don't have textbooks
        available_courses = []
        available_textbooks = []
        for section_header in section_headers:
            try:
                sibling = section_header.find_next_sibling()
                if "not been informed" in sibling.text.lower(): # filter out the textbook-less sections
                    continue
            except:
                continue
            matches = re.search("- (.+)[YS], section (.+?) ", section_header.text)
            all_textbooks_info = sibling.find_all('td', class_="book-desc")
            print "\t\t\tFor %s section %s, found %d textbook(s). These are:" % (matches.group(1), matches.group(2), len(all_textbooks_info)) 
            course = Course.objects.get(code=matches.group(1))
            course_offerings = CourseOffering.objects.filter(course=course, meeting_section=matches.group(2))
            for textbook_info in all_textbooks_info:
                try:
                    title = textbook_info.find('span', class_="book-title").text
                    author = textbook_info.find('span', class_="book-author").text
                    isbn = textbook_info.find('span', class_="isbn").text.replace("-", "")
                except: 
                    continue
                req = textbook_info.find('p', class_="book-req").text

                info = self.get_amazon_fields(isbn)
                if (info == None): 
                    continue
                try:
                    textbook = Textbook.objects.get(isbn=isbn)
                except:
                    textbook = Textbook(
                        isbn = isbn,
                        is_required = (req.strip().lower() == "required"),
                        detail_url = info['DetailPageURL'],
                        image_url = info["ImageURL"],
                        author = info["Author"],
                        title = info["Title"])
                    textbook.save()
                    self.textbooks_found_count += 1
                    if (self.textbooks_found_count % 5 == 0):
                        print "=====FOUND %d TEXTBOOKS SO FAR=====" % (self.textbooks_found_count)

                print "\t\t\t %s by: %s." % (title, author)
                print "\t\t\t ISBN: %s, Book is %s. Saved!" % (isbn, req)

                for offering in course_offerings:
                    if offering.textbooks.filter(isbn=isbn).exists(): continue
                    offering.textbooks.add(textbook)
                    offering.save()



    def select_by_partial_text(self, text, selector, wait=1):
        try:
            for option in selector.options:
                if text in option.text:
                    selector.select_by_visible_text(option.text)
                    sleep(wait)
                    return option.text
        except:
            print "=====SOMETHING WENT WRONG WHILE PROCESSING OPTIONS====="
            print "===========PARTIAL TEXT: %s, WAIT: %d ==========" % (text, wait)
            self.error_count += 1
            pass
        return None

    def get_all_sections(self, c):
        offerings = CourseOffering.objects.filter((Q(semester=self.semester) | Q(semester='Y')), \
                                                course=c)
        sections = []
        for off in offerings:
            if off.meeting_section not in sections:
                sections.append(off.meeting_section)
        return sections


    def get_amazon_fields(self,isbn):
        try:
            result = api.item_lookup(isbn.strip(), IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
            info = {
                "DetailPageURL" : self.get_detail_page(result),
                "ImageURL" : self.get_image_url(result),
                "Author" : self.get_author(result),
                "Title" : self.get_title(result)
            }
        except InvalidParameterValue:
            print "InvalidParameterException. ISBN: " + isbn
            info = None

        except:
            import traceback
            traceback.print_exc()
            info = None
            
        return info

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

    
x = UofTTextbookParser()

