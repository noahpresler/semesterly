from selenium import webdriver
from time import sleep
import json
import requests, cookielib
import os
import sys
import django
from toolz import itertoolz
from collections import OrderedDict
import re
from selenium.webdriver.support.ui import Select
from timetable.models import *

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
WEBDRIVER_CHROME = '/home/linoah/chromedriver' # e.g. '/home/linoah/chromedriver'
#=====================================================================================================

django.setup()

class HopkinsCourseFinder: 
    def get_school_name(self, td):
        return td[0]

    def get_class_number(self, td):
        return td[1]

    def get_class_name(self, td):
         return td[2]

    def get_class_term(self, td):
        return td[3]

    def get_class_location(self, details):
        text = details.text
        pattern = re.compile(r"^.*\|.*\|\s(.*)$", re.MULTILINE)
        matches = re.findall(pattern,text)
        return '/'.join(matches)

    def get_class_times(self, td):
        return td[5]

    def get_class_instructors(self, td):
        return td[6]

    def get_class_description(self, details):
        td = details.find_elements_by_xpath('span')
        return td[0]

    def get_class_prereqs(self, details):
        td = details.find_elements_by_xpath('span')
        if len(td) >= 4:
            return td[4]
        else:
            return ''


    def merge_lists(self, evens,odds):
        courses = []
        while evens:
            if odds:
                courses.insert(0,odds.pop())
            courses.insert(0,evens.pop())

        if odds:
            courses.insert(0,odds.pop())
        return courses

    def generate_courses(self, classes,details):
        index = 0;
        for row in classes:
            pieces = row.find_elements_by_css_selector('td')
            if len(details) > 0:
                try:
                    course = self.get_course_basics(pieces, details.pop(0))
                except:
                    print "Error adding this course"
            

    def get_course_basics(self, pieces,details):
        class_name = self.get_class_name(pieces).text
        try:
            print "Getting Data on Course: " + class_name
        except UnicodeEncodeError:
            print "Print statement omitted for UnicodeEncodeError."
        school_name = self.get_school_name(pieces).text
        class_number = self.get_class_number(pieces).text
        section_number = re.search(r"\(([A-Za-z0-9_.]+)\)",class_number)
        class_number = class_number[:-1*len(section_number.group(0))]
        class_term = self.get_class_term(pieces).text
        class_time = self.get_class_times(pieces).text
        class_location = self.get_class_location(details)
        class_instructors = self.get_class_instructors(pieces).text
        class_description = self.get_class_description(details).text
        class_prereqs = self.get_class_prereqs(details)

        day_to_letter_map = {'m': 'M', 
            't': 'T', 
            'w': 'W',
            'th': 'R',
            'f': 'F',
            'sa': 'S',
            's': 'U'}

        time_data = []
        for time in class_time.split(','):
            if len(time) > 0:
                time_pieces = re.search(r"([^\s]+)\s(\d?\d):(\d\d)([AP])M\s-\s(\d?\d):(\d\d)([AP])M",time)

                #Regex:______________________________
                #   |           |                   |
                #   |  Groups # |      Function     |
                #   |___________|___________________|
                #   |   1       |       Day         |
                #   |   2       |    Start Hour     |
                #   |   3       |    Start Minute   |
                #   |   4       |  Start A/P (AM/PM)|
                #   |   5       |     End Hour      |
                #   |   6       |   End Minutes     |
                #   |   7       |  End A/P (AM/PM)  |
                #   |_______________________________|
                #

                hours = [None] * 2
                start_hour = int(time_pieces.group(2))
                end_hour = int(time_pieces.group(5))
                if time_pieces.group(4).upper() == "P" and time_pieces.group(2) != "12":
                    start_hour += 12
                if time_pieces.group(7).upper() == "P" and time_pieces.group(5) != "12":
                    end_hour += 12
                hours[0] = str(start_hour) + ":" + time_pieces.group(3)
                hours[1] = str(end_hour) + ":" + time_pieces.group(6)
                duration = (end_hour) - (start_hour) #TODO: FIX THIS

                days = time_pieces.group(1)
                if days != "TBA" and days !="None":
                    for day_letter in re.findall(r"([A-Z][a-z]*)+?",days):
                        day = day_to_letter_map[day_letter.lower()]
                        time_data.append(OrderedDict([
                            ("day", day),
                            ("start", hours[0]),
                            ("end", hours[1]),
                            ("duration", ""),  #TODO: DURATION IS EMPTY
                            ("location", class_location)
                    ]))

        section = OrderedDict([
            ("code", section_number.group(0)),
            ("instructors", class_instructors),
            ("times", time_data),
            ("size", ''),
            ("enrolment", ''),
            ('alternates', '')

        ])
        if class_number == self.prev_class_number:
            self.courses[-1]["meeting_sections"].append(section)
        else:
            sections = []
            sections.append(section)
            course = OrderedDict([
                ("id", ''),
                ("code", class_number),
                ("name", class_name),
                ("description", class_description),
                # ("division", division),
                # ("department", department),
                ("prerequisites", ''),      #TODO
                ("exclusions", ''),
                # ("level", course_level),
                # ("campus", campus),
                # ("term", term),  
                ("breadths", ''),
                ("meeting_sections", sections)
            ])
            self.prev_class_number = class_number
            self.courses.append(course)


    def __init__(self):
        if len(sys.argv) != 2 or (sys.argv[1] != "spring" and sys.argv[1] != "fall"):
            try:
                print "You must supply a semester either spring or fall to parse."
            except UnicodeEncodeError:
                print "Print statement omitted for UnicodeEncodeError."
            exit()
        elif len(sys.argv) == 2: 
            self.semester = str(sys.argv[1])
        try:
            print "Parsing Data For: " + self.semester + " Semester"
        except UnicodeEncodeError:
            print "Print statement omitted for UnicodeEncodeError."

        if not WEBDRIVER_CHROME:
            self.driver = webdriver.Chrome()
        else: 
            self.driver = webdriver.Chrome(WEBDRIVER_CHROME)

        self.driver.get("https://isis.jhu.edu/classes/")

        if self.semester == "spring":
            selector = Select(self.driver.find_element_by_id("ctl00_content_lbTerms"))
            selector.deselect_all()
            selector.select_by_value("Spring 2016")

        self.driver.find_element_by_id("ctl00_content_btnSearch").click()
        self.next_button = self.driver.find_element_by_id("ctl00_content_ucPageNumbersBottom_lbNext")
        self.courses = []
        self.course_updates = 0
        self.course_creates = 0
        self.offering_updates = 0
        self.offering_creates = 0
        self.prev_class_number = None
        expand_button = self.driver.find_element_by_id("ctl00_content_lbShowHideDetails")
        expand_button.click()
        selector = Select(self.driver.find_element_by_id("ctl00_content_ddlResultsPerPage"))
        selector.select_by_value("100")

        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        if not os.path.exists('json'):
            os.makedirs('json')

    def parse_classes(self):
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        count = 1
        while self.next_button is not None:
            details_rows = self.driver.find_elements_by_xpath('//*[@id="classdetailstext"]')
            odd_class_rows = self.driver.find_elements_by_class_name("odd")
            even_class_rows = self.driver.find_elements_by_class_name("even")
            class_rows = self.merge_lists(even_class_rows,odd_class_rows)            
            self.generate_courses(class_rows,details_rows)
            try: 
                self.next_button = self.driver.find_element_by_id("ctl00_content_ucPageNumbersBottom_lbNext")
            except:
                break
            self.next_button.click()
            count += 1
        self.update_files()
        print "Courses: [" + str(self.course_updates) + "/" + str(self.course_creates) + "] [Updated/Created]"
        print "Offerings: [" + str(self.offering_updates) + "/" + str(self.offering_creates) + "] [Updated/Created]"

    def update_files(self):
        for curr_course in self.courses:
            try:
                course = HopkinsCourse.objects.get(code=curr_course['code'])
                course.name=curr_course['name'] 
                course.description=curr_course['description']
                course.campus=1       #TODO
                course.breadths=curr_course['breadths']
                course.prerequisites=curr_course['prerequisites']
                course.exclusions=curr_course['exclusions']
                course.save()
                self.course_updates+=1
                try:
                    print "UPDATED  " + curr_course['name']
                except UnicodeEncodeError:
                    print "Print statement omitted for UnicodeEncodeError."
            except:
                course = HopkinsCourse(code=curr_course['code'], 
                    name=curr_course['name'], 
                    description=curr_course['description'],
                    campus=1,       #TODO
                    breadths=curr_course['breadths'],
                    prerequisites=curr_course['prerequisites'],
                    exclusions=curr_course['exclusions'])
                course.save()
                self.course_creates+=1
                try:
                    print "CREATED course " + curr_course['name']
                except UnicodeEncodeError:
                    print "Print statement omitted for UnicodeEncodeError."

            for section in curr_course['meeting_sections']:
                for time in section['times']:
                    try: 
                        co = HopkinsCourseOffering.objects.get(course=course, semester=self.semester[0].upper(), meeting_section = section['code'], day=time['day'], time_start=time['start'],time_end=time['end'], instructors=section['instructors'])
                        co.location=time['location']
                        co.size=0     #TODO
                        co.enrolment=0    #TODO
                        co.alternates=section['alternates']
                        self.offering_updates+=1
                        co.save()
                    except: 
                        co = HopkinsCourseOffering(course=course, 
                        semester=self.semester[0].upper(),
                        meeting_section=section['code'],
                        instructors=section['instructors'],
                        day=time['day'],
                        time_start=time['start'],
                        time_end=time['end'],
                        location=time['location'],
                        size=0,     #TODO
                        enrolment=0,    #TODO
                        alternates=section['alternates'])
                        self.offering_creates+=1
                        try:
                            print "HopkinsCourse Offering CREATED: " + course.name
                        except UnicodeEncodeError:
                            print "Print statement omitted for UnicodeEncodeError."
                        co.save()

cf = HopkinsCourseFinder()
cf.parse_classes()