from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib
import requests, urllib2, urllib
import json
import os
import re
from time import sleep
from random import randint
from django.utils.encoding import smart_str, smart_unicode
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from amazonproduct import API
api = API(locale='us')  

class Section:
    def __init__(self, section_id, name):
        self.id = section_id
        self.name = name
        self.sections = []

    def __str__(self):
        return (
            "Section id: " + self.id + ", name: " + self.name + "\n"
        )

class Course:
    def __init__(self, course_id, name):
        self.id = course_id
        self.name = name
        self.sections = []

    def __str__(self):
        return (
            "Course id: " + self.id + ", name: " + self.name + "\n"
        )

class Department:
    def __init__(self, department_id, name):
        self.id = department_id
        self.name = name
        self.courses = []

    def __str__(self):
        return (
            "Department id: " + self.id + ", name: " + self.name + "\n"
        )

class Semester:
    def __init__(self, semester_id, name):
        self.id = semester_id
        self.name = name
        self.departments = []

    def __str__(self):
        return (
            "Semester id: " + self.id + ", name: " + self.name + "\n"
        )

class TextbookParser:
    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.semesters = []
        self.max_textbooks = 100
        self.book_request_count = 0
        self.create_count = 0
        self.identified_count = 0
        self.isbn_pattern = pattern = re.compile(r"(?:\b\d{13}\b)", re.MULTILINE)
        self.code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")

        # TODO: This is unique to each university.
        self.store_id = "15551"
        self.store_link = "umcp.bncollege.com"
        self.course = UmdCourse
        self.course_offerings = UmdCourseOffering
        self.course_link = UmdLink

        self.textbook_payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"storeId\"\r\n\r\n" + self.store_id + "\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"catalogId\"\r\n\r\n10001\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"langId\"\r\n\r\n-1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"clearAll\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"viewName\"\r\n\r\nTBWizardView\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"secCatList\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"removeSectionId\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"mcEnabled\"\r\n\r\nN\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"showCampus\"\r\n\r\nfalse\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectTerm\"\r\n\r\nSelect+Term\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectDepartment\"\r\n\r\nSelect+Department\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectSection\"\r\n\r\nSelect+Section\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectCourse\"\r\n\r\nSelect+Course\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"campus1\"\r\n\r\n14704480\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"firstTermName_14704480\"\r\n\r\nFall+2016\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"firstTermId_14704480\"\r\n\r\n73256452\r\n-----011000010111000001101001"

    def eval_response(self, request_type, url, params, headers, payload):
        while True:
            try:
                response = self.make_request(request_type, url, params, headers, payload)
                return eval(response.text)
                break
            except:
                self.retry_request(headers)

    def make_request(self, request_type, url, params, headers, payload):
        # print(url)
        # print(params)
        # print(headers)
        # print(payload)


        headers["user-agent"] = self.ua.random
        try:
            return self.session.request(request_type, url, params=params,  headers=headers, data=payload)
        except:
            sleep(randint(300, 500))
            self.retry_request(headers)

    def retry_request(self, headers):
        # print("error, ua: " + headers["user-agent"])
        # print(headers)
        headers["user-agent"] = self.ua.random
        self.session = requests.Session()
        self.parse_semesters(True)

    def parse(self):
        self.semesters = self.parse_semesters(False)
        self.parse_departments()
        self.get_textbooks()

    def parse_semesters(self, is_retry):
        url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView"
        params = {"catalogId":"10001","langId":"-1","storeId":self.store_id}

        payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"id\"\r\n\r\n0\r\n-----011000010111000001101001--"
        headers = {
            'content-type': "multipart/form-data; boundary=---011000010111000001101001",
            'User-Agent': self.ua.random
            }

        response = self.make_request("POST", url, params, headers, payload)

        if response == None:
            sleep(randint(300, 500))
            self.retry_request(headers)
            return

        soup = BeautifulSoup(response.text,"html.parser")
        semester_list = soup.find(class_="bncbSelectBox termHeader")
        if semester_list == None:
            if is_retry:
                return
            else:
                print("error parsing semesters, response:" + response.text)
                exit()
        semesters = []
        for li in semester_list.findAll("li"):
            sem_name = li.contents[0]
            sem_id = li["data-optionvalue"]
            semester = Semester(sem_id, sem_name)

            semesters.append(semester)
        return semesters

    def parse_departments(self):
        for semester in self.semesters:
            url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TextBookProcessDropdownsCmd"

            params = {"campusId":"14704480","termId":semester.id,"deptId":"","courseId":"","sectionId":"","storeId": self.store_id,"catalogId":"10001","langId":"-1","dropdown":"term"}

            payload = ""
            headers = {
                'host': self.store_link,
                'connection': "keep-alive",
                'accept': "application/json, text/javascript, */*; q=0.01",
                'origin': "http://" + self.store_link,
                'x-requested-with': "XMLHttpRequest",
                'user-agent': self.ua.random,
                'referer': "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView?catalogId=10001&langId=-1&storeId=" + self.store_id,
                }

            departments = self.eval_response("POST", url, params, headers, payload)

            for dep in departments:
                dep_id = dep["categoryId"]
                dep_name = dep["categoryName"]
                department = Department(dep_id, dep_name)
                semester.departments.append(department)
                self.parse_courses(semester, department)

    def parse_courses(self, semester, department):
        url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TextBookProcessDropdownsCmd"

        params = {"campusId":"14704480","termId":semester.id,"deptId":department.id,"courseId":"","sectionId":"","storeId":self.store_id,"catalogId":"10001","langId":"-1","dropdown":"dept"}

        payload = ""
        headers = {
            'host': self.store_link,
            'connection': "keep-alive",
            'accept': "application/json, text/javascript, */*; q=0.01",
            'origin': "http://" + self.store_link,
            'x-requested-with': "XMLHttpRequest",
            'user-agent': self.ua.random,
            'referer': "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView?catalogId=10001&langId=-1&storeId=" + self.store_id,
            }

        courses = self.eval_response("POST", url, params, headers, payload)

        for c in courses:
            c_id = c["categoryId"]
            c_name = c["categoryName"]
            course = Course(c_id, c_name)
            department.courses.append(course)
            self.parse_sections(semester, department, course)

    def parse_sections(self, semester, department, course):
        url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TextBookProcessDropdownsCmd"

        params = {"campusId":"14704480","termId":semester.id,"deptId":department.id,"courseId":course.id,"sectionId":"","storeId":self.store_id,"catalogId":"10001","langId":"-1","dropdown":"course"}

        payload = ""
        headers = {
            'user-agent': self.ua.random,
            }

        sections = self.eval_response("POST", url, params, headers, payload)

        for s in sections:
            s_id = s["categoryId"]
            s_name = s["categoryName"]
            section = Section(s_id, s_name)
            course.sections.append(section)

    def get_textbooks(self):
        self.num_textbooks = 0
        textbook_url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/BNCBTBListView"
        textbook_headers = {
            'content-type': "multipart/form-data; boundary=---011000010111000001101001",
            'host': self.store_link,
            'connection': "keep-alive",
            'accept': "application/json, text/javascript, */*; q=0.01",
            'origin': "http://" + self.store_link,
            'x-requested-with': "XMLHttpRequest",
            'user-agent': self.ua.random,
            'referer': "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView?catalogId=10001&langId=-1&storeId=" + self.store_id,
            }
        textbook_payload = self.textbook_payload
        for semester in self.semesters:
            for department in semester.departments:
                for course in department.courses:
                    for section in course.sections:
                        self.num_textbooks += 1
                        textbook_payload = self.add_textbook(section.id, textbook_url, textbook_headers, textbook_payload, False)
        if self.num_textbooks != self.max_textbooks:
            textbook_payload = self.add_textbook(section.id, textbook_url, textbook_headers, textbook_payload, True)

    def add_textbook(self, section_id, textbook_url, textbook_headers, textbook_payload, force_request):
        if self.num_textbooks == self.max_textbooks or force_request:
            # textbook_payload += "\r\nContent-Disposition: form-data; name=\"numberOfCourseAlready\"\r\n\r\n" + str(num_textbooks) + "\r\n-----011000010111000001101001--"
            textbook_payload += "--"
            response = self.make_request("POST", textbook_url, "", textbook_headers, textbook_payload)
            self.parse_textbooks(response.text)
            self.num_textbooks = 0
            return self.textbook_payload
            # exit()
        return textbook_payload + "\r\nContent-Disposition: form-data; name=\"section_" + str(self.num_textbooks) + "\"\r\n\r\n" + str(section_id) + "\r\n-----011000010111000001101001"

    def parse_textbooks(self,html):
        soup = BeautifulSoup(html, "html.parser")
        textbooks = soup.findAll('div', class_='book_details')
        textbook_sections = soup.findAll('div',class_="book_sec")
        print "( Request #: " + str(self.book_request_count) + ") " + str(len(textbooks)) + " textbooks found."
        self.book_request_count += 1
        self.last_num_found = len(textbooks)
        for tbsec in textbook_sections:
            raw_code = tbsec.findAll('h1')[0]
            stripped_code = "".join(raw_code.get_text().split())[:8]
            course_code = stripped_code[:3] + "." + stripped_code[3:6]
            section = "(" + stripped_code[6:8] + ")"
            for tb in tbsec.findAll('div',class_="book_details"):
                # print(tb.get_text().encode("utf-8"))
                # match = re.findall(self.isbn_pattern,"".join(tb.get_text()))
                match = re.findall(self.isbn_pattern,"".join(tb.get_text()))
                # if len(match) == 0:
                #     print(tb.get_text())
                if len(match) > 0:
                    isbn_number = match[0]
                    is_required = self.check_required(tb.find('span', class_="recommendBookType").get_text())
                    self.make_textbook(is_required, isbn_number, course_code, section)
        try:
            print "\n"
        except UnicodeEncodeError:
            pass

    def make_textbook(self, is_required, isbn_number, course_code, section):
        try:
            course = self.course.objects.filter(code__contains=course_code)[0]
        except IndexError:
            print("index error: " + course_code)
            return
        course_offerings = self.course_offerings.objects.filter(course=course,meeting_section = section)
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
            new_link = self.course_link(courseoffering=co, textbook=textbook,
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

    def remove_duplicates(self,l):
        return list(set(l))

if __name__ == '__main__':
    parser = TextbookParser()
    parser.parse()