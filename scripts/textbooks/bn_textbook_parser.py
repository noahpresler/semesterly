# @what     B&N generalized scraper.
# @org      Semeseter.ly
# @author   Michael N. Miller & Eric Calder
# @date     3/6/17

from __future__ import print_function # NOTE: slowly move toward Python3

import os, re, requests
from random import randint
from fake_useragent import UserAgent
from time import sleep

from scripts.parser_library.base_parser import BaseParser
from amazon import amazon_textbook_fields

from scripts.parser_library.internal_exceptions import CourseParseError

class TextbookSection:
    def __init__(self, section_id, name):
        self.id = section_id
        self.name = name
        self.sections = []

    def __str__(self):
        return 'Section -- id: {}, name: {}'.format(self.id, self.name)

class TextbookCourse:
    def __init__(self, course_id, name):
        self.id = course_id
        self.name = name
        self.sections = []

    def __str__(self):
        return 'Course -- id: {}, name: {}'.format(self.id, self.name)

class TextbookDepartment:
    def __init__(self, department_id, name):
        self.id = department_id
        self.name = name
        self.courses = []

    def __str__(self):
        return 'Department -- id: {}, name: {}'.format(self.id, self.name)

class TextbookSemester:
    def __init__(self, semester_id, name, term, year):
        self.id = semester_id
        self.name = name
        self.term = term
        self.year = year
        self.departments = []

    def __str__(self):
        return 'Semester -- term: {}, year: {}, id: {}'.format(self.term, self.year, self.id)

class BNParser(BaseParser):
    def __init__(self, store_id, store_link, school, delimeter, term=None, year=None, **kwargs):
        self.year = year
        self.term = term
        self.semesters = []
        self.max_textbooks = 100
        self.book_request_count = 0
        self.create_count = 0
        self.identified_count = 0
        self.isbn_pattern = re.compile(r"(?:\b\d{13}\b)", re.MULTILINE)
        self.code_pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")

        # TODO: This is unique to each university.
        self.store_id = store_id
        self.store_link = store_link
        self.school = school
        self.delimeter = delimeter

        self.begining_textbook_payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"storeId\"\r\n\r\n" + self.store_id + "\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"catalogId\"\r\n\r\n10001\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"langId\"\r\n\r\n-1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"clearAll\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"viewName\"\r\n\r\nTBWizardView\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"secCatList\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"removeSectionId\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"mcEnabled\"\r\n\r\nN\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"showCampus\"\r\n\r\nfalse\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectTerm\"\r\n\r\nSelect+Term\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectDepartment\"\r\n\r\nSelect+Department\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectSection\"\r\n\r\nSelect+Section\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectCourse\"\r\n\r\nSelect+Course\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"campus1\"\r\n\r\n14704480\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"firstTermName_14704480\"\r\n\r\nFall+2016\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"firstTermId_14704480\"\r\n\r\n73256452\r\n-----011000010111000001101001"
        self.textbook_payload = TextbookPayload(self.store_id)

        self.ua = UserAgent()
        super(BNParser, self).__init__(school, **kwargs)

    def start(self,
        years=None,
        terms=None,
        departments=None,
        textbooks=True,
        verbosity=3,
        **kwargs):
        if years is None:
            years = [self.year]
        if terms is None:
            terms = [self.term]
        for year in years:
            self.year = year
            for term in terms:
                self.term = term
                self.parse()
        self.ingestor.wrap_up()

    def parse(self):

        self.url = 'http://{}/webapp/wcs/stores/servlet/'.format(self.store_link)
        self.params = {
            "campusId":"14704480",
            "termId":"",
            "deptId":"",
            "courseId":"",
            "sectionId":"",
            "storeId":self.store_id,
            "catalogId":"10001",
            "langId":"-1",
            "dropdown":"course"
        }

        self.semesters = self.parse_semesters(False)
        self.requester.headers = {'User-Agent': UserAgent().random}
        for semester in self.semesters:
            departments = self.parse_departments(semester)
            for department in departments:
                courses = self.parse_courses(semester, department)
                for course in courses:
                    sections = self.parse_sections(semester, department, course)
                    for section in sections:
                        textbooks = self.get_textbooks(section.id)
        if self.textbook_payload.counter != self.textbook_payload.max:
            textbooks = self.get_textbooks(section.id, True)

    def parse_semesters(self, is_retry=False):
        url = self.url + 'TBWizardView'
        params = {
            "catalogId":"10001",
            "langId":"-1",
            "storeId":self.store_id
        }

        payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"id\"\r\n\r\n0\r\n-----011000010111000001101001--"
        self.requester.headers['content-type'] = "multipart/form-data; boundary=---011000010111000001101001"
        semester_list = self.requester.post(url, 
            params=params,
            data=payload,
            throttle=lambda:sleep(randint(300, 500))
        ).find(class_="bncbSelectBox termHeader")

        semesters = []
        for li in semester_list.find_all("li"):
            sem_id = li["data-optionvalue"]
            name = li.contents[0]
            term, year = name.split()
            semesters.append(TextbookSemester(sem_id, name, term, year))
        return semesters

    def parse_departments(self, semester):
        url = self.url + 'TextBookProcessDropdownsCmd'
        self.params.update({
            'termId': semester.id,
            'dropdown': 'term'
        })
        self.requester.headers = {
            'User-Agent': UserAgent().random,
        }

        return self.get_objects(url, self.params)

    def parse_courses(self, semester, department):
        url = self.url + 'TextBookProcessDropdownsCmd'
        self.params.update({
            'deptId': department.id,
            'dropdown': 'dept'
        })
        self.requester.headers = {
            'User-Agent': UserAgent().random,
        }

        return self.get_objects(url, self.params)

    def parse_sections(self, semester, department, course):
        url = self.url + 'TextBookProcessDropdownsCmd'
        self.params.update({
            'courseId': course.id,
            'dropdown': 'course'
        })
        self.requester.headers = {
            'User-Agent': UserAgent().random,
        }

        return self.get_objects(url, self.params)

    def get_objects(self, url, params):
        objs = []
        while True:
            raw_objs = self.requester.post(url,
                params=params,
                throttle=lambda:sleep(randint(300, 500))
            )
            objs = []
            success = True
            for obj in raw_objs:
                extracted = self.extract_id_and_name(obj)
                if extracted is False:
                    success = False
                    break
                id_, name = extracted
                objs.append(TextbookSection(id_, name))
            if success is True:
                break
        return objs

    def extract_id_and_name(self, obj):
        try:   
            id_ = obj["categoryId"]
            name = obj["categoryName"]
            return id_, name
        except KeyError:
            self.requester.session = requests.Session()
            self.requester.headers = {'User-Agent': UserAgent().random}
            self.parse_semesters(True)
            return False

    def parse_textbooks(self, soup):
        textbooks = soup.find_all('div', class_='book_details')
        textbook_sections = soup.find_all('div',class_="book_sec")
        print("( Request #: " + str(self.book_request_count) + ") " + str(len(textbooks)) + " textbooks found.")
        self.book_request_count += 1
        self.last_num_found = len(textbooks)
        for tbsec in textbook_sections:
            raw_code = tbsec.find_all('h1')[0]
            code_list = raw_code.get_text().split()[:-2]
            course_code = self.delimeter.join(code_list[:-1])
            if len(code_list[2]) == 1:
                section = "(0" + code_list[2] + ")"
            else:
                section = "(" + code_list[2] + ")"
            for tb in tbsec.find_all('div',class_="book_details"):
                match = re.findall(self.isbn_pattern,"".join(tb.get_text()))
                if len(match) > 0:
                    isbn_number = match[0]
                    is_required = self.check_required(tb.find('span', class_="recommendBookType").get_text())
                    self.make_textbook(is_required, isbn_number, course_code, section)

    def make_textbook(self, is_required, isbn_number, course_code, section_code):

        # Update/Create textbook.
        self.ingestor['isbn'] = isbn_number
        self.ingestor.update(amazon_textbook_fields(str(isbn_number)))
        self.ingestor.ingest_textbook()

        # Link to all course offerings.
        self.ingestor['school'] = self.school
        self.ingestor['course_code'] = course_code
        self.ingestor['section_code'] = section_code
        self.ingestor['term'] = self.term
        self.ingestor['year'] = self.year
        self.ingestor['isbn'] = isbn_number
        self.ingestor['required'] = is_required
        self.ingestor.ingest_textbook_link()

    def check_required(self,html):
        if html.find("REQUIRED") != -1:
            return True
        else:
            return False

    def get_textbooks(self, section_id, forced=False):
        payload = self.textbook_payload.add_textbook(section_id, forced)
        if payload is None:
            return None

        self.requester.headers = {
            'content-type': "multipart/form-data; boundary=---011000010111000001101001",
            'User-Agent': UserAgent().random,
        }
        url = self.url + 'BNCBTBListView'
        soup = self.requester.post(url, data=payload, throttle=lambda:sleep(randint(300, 500)))
        textbooks = self.parse_textbooks(soup)

        return textbooks

class TextbookPayload:
    def __init__(self, store_id):
        self.counter = 0
        self.max = 100
        self.begining_payload = '-----011000010111000001101001\r\nContent-Disposition: form-data; name="storeId"\r\n\r\n{}'.format(store_id) + '\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="catalogId"\r\n\r\n10001\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="langId"\r\n\r\n-1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="clearAll"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="viewName"\r\n\r\nTBWizardView\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="secCatList"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="removeSectionId"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="mcEnabled"\r\n\r\nN\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="showCampus"\r\n\r\nfalse\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="selectTerm"\r\n\r\nSelect+Term\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="selectDepartment"\r\n\r\nSelect+Department\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="selectSection"\r\n\r\nSelect+Section\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="selectCourse"\r\n\r\nSelect+Course\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="campus1"\r\n\r\n14704480\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="firstTermName_14704480"\r\n\r\nFall+2016\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="firstTermId_14704480"\r\n\r\n73256452\r\n-----011000010111000001101001'
        self.payload = self.begining_payload

    def add_textbook(self, section_id, forced=False):
        if forced:
            return self.dump()
        self.counter += 1
        self.payload += '\r\nContent-Disposition: form-data; name="section_{}"\r\n\r\n{}\r\n-----011000010111000001101001'.format(str(self.counter), str(section_id))
        if self.counter >= self.max:
            return self.dump()
        return None

    def dump(self):
        if self.counter == 0:
            return None
        self.counter = 0
        payload = self.payload
        self.payload = self.begining_payload
        return payload + '--'
