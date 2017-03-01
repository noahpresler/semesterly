import os, re
from random import randint
from scripts.parser_library.Requester import Requester
from amazon import *


from fake_useragent import UserAgent

class TextbookSection:
    def __init__(self, section_id, name):
        self.id = section_id
        self.name = name
        self.sections = []

    def __str__(self):
        return (
            "Section id: " + self.id + ", name: " + self.name
        )

class TextbookCourse:
    def __init__(self, course_id, name):
        self.id = course_id
        self.name = name
        self.sections = []

    def __str__(self):
        return (
            "Course id: " + self.id + ", name: " + self.name
        )

class TextbookDepartment:
    def __init__(self, department_id, name):
        self.id = department_id
        self.name = name
        self.courses = []

    def __str__(self):
        return (
            "Department id: " + self.id + ", name: " + self.name
        )

class TextbookSemester:
    def __init__(self, semester_id, name):
        self.id = semester_id
        self.name = name
        self.departments = []

    def __str__(self):
        return (
            "Semester id: " + self.id + ", name: " + self.name
        )

class TextbookParser:
    def __init__(self, store_id, store_link, school, delimeter):
        self.semesters = []
        self.max_textbooks = 100
        self.book_request_count = 0
        self.create_count = 0
        self.identified_count = 0
        self.isbn_pattern = pattern = re.compile(r"(?:\b\d{13}\b)", re.MULTILINE)
        self.code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
        self.textbook_link = TextbookLink

        # TODO: This is unique to each university.
        self.store_id = store_id
        self.store_link = store_link
        self.school = school
        self.delimeter = delimeter

        self.textbook_payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"storeId\"\r\n\r\n" + self.store_id + "\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"catalogId\"\r\n\r\n10001\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"langId\"\r\n\r\n-1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"clearAll\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"viewName\"\r\n\r\nTBWizardView\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"secCatList\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"removeSectionId\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"mcEnabled\"\r\n\r\nN\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"showCampus\"\r\n\r\nfalse\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectTerm\"\r\n\r\nSelect+Term\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectDepartment\"\r\n\r\nSelect+Department\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectSection\"\r\n\r\nSelect+Section\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"selectCourse\"\r\n\r\nSelect+Course\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"campus1\"\r\n\r\n14704480\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"firstTermName_14704480\"\r\n\r\nFall+2016\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"firstTermId_14704480\"\r\n\r\n73256452\r\n-----011000010111000001101001"

        self.requester = Requester()
        self.ua = UserAgent()

    def parse(self):
        print("Parsing semester.")
        self.semesters = self.parse_semesters(False)
        print("Finished parsing semester.\nParsing departments.")
        self.parse_departments()
        print("Finished parsing departments\nParsing textbooks.")
        self.get_textbooks()

    def parse_semesters(self, is_retry):
        url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView"
        params = {"catalogId":"10001","langId":"-1","storeId":self.store_id}

        payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"id\"\r\n\r\n0\r\n-----011000010111000001101001--"
        self.requester.overwrite_header({'content-type': "multipart/form-data; boundary=---011000010111000001101001"})

        soup = self.requester.post(url, params=params, form=payload, throttle=lambda:randint(300, 500))

        semester_list = soup.find(class_="bncbSelectBox termHeader")
        if semester_list == None:
            if is_retry:
                print soup
                return
            else:
                print("error parsing semesters")
                exit()
        semesters = []
        for li in semester_list.findAll("li"):
            sem_name = li.contents[0]
            sem_id = li["data-optionvalue"]
            semester = TextbookSemester(sem_id, sem_name)

            semesters.append(semester)
        return semesters

    def parse_departments(self):
        for semester in self.semesters:
            url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TextBookProcessDropdownsCmd"

            params = {"campusId":"14704480","termId":semester.id,"deptId":"","courseId":"","sectionId":"","storeId": self.store_id,"catalogId":"10001","langId":"-1","dropdown":"term"}

            payload = ""
            self.requester.overwrite_header({
                'host': self.store_link,
                'connection': "keep-alive",
                'accept': "application/json, text/javascript, */*; q=0.01",
                'origin': "http://" + self.store_link,
                'x-requested-with': "XMLHttpRequest",
                'referer': "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView?catalogId=10001&langId=-1&storeId=" + self.store_id,
                })
            
            departments = self.requester.post(url, params=params, form=payload, throttle=lambda:randint(300, 500))

            for dep in departments:
                while True:
                    try:
                        dep_id = dep["categoryId"]
                        dep_name = dep["categoryName"]
                        break
                    except KeyError:
                        self.requester.reset_session()
                        self.parse_semesters(True)
                department = TextbookDepartment(dep_id, dep_name)
                semester.departments.append(department)
                print("Parsing department " + str(department))
                self.parse_courses(semester, department)


    def parse_courses(self, semester, department):
        url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TextBookProcessDropdownsCmd"

        params = {"campusId":"14704480","termId":semester.id,"deptId":department.id,"courseId":"","sectionId":"","storeId":self.store_id,"catalogId":"10001","langId":"-1","dropdown":"dept"}

        payload = ""
        self.requester.overwrite_header({
            'host': self.store_link,
            'connection': "keep-alive",
            'accept': "application/json, text/javascript, */*; q=0.01",
            'origin': "http://" + self.store_link,
            'x-requested-with': "XMLHttpRequest",
            'referer': "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView?catalogId=10001&langId=-1&storeId=" + self.store_id,
            })

        courses = self.requester.post(url, params=params, form=payload, throttle=lambda:randint(300, 500))
        for c in courses:
            while True:
                try:
                    c_id = c["categoryId"]
                    c_name = c["categoryName"]
                    break
                except KeyError:
                    self.requester.reset_session()
                    self.parse_semesters(True)
            course = TextbookCourse(c_id, c_name)
            department.courses.append(course)
            self.parse_sections(semester, department, course)

    def parse_sections(self, semester, department, course):
        url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/TextBookProcessDropdownsCmd"

        params = {"campusId":"14704480","termId":semester.id,"deptId":department.id,"courseId":course.id,"sectionId":"","storeId":self.store_id,"catalogId":"10001","langId":"-1","dropdown":"course"}

        payload = ""

        sections = self.requester.post(url, params=params, form=payload, throttle=lambda:randint(300, 500))

        for s in sections:
            while True:
                try:
                    s_id = s["categoryId"]
                    s_name = s["categoryName"]
                    break
                except KeyError:
                    self.requester.reset_session()
                    self.parse_semesters(True)
            section = TextbookSection(s_id, s_name)
            course.sections.append(section)

    def get_textbooks(self):
        self.num_textbooks = 0
        textbook_url = "http://" + self.store_link + "/webapp/wcs/stores/servlet/BNCBTBListView"
        self.requester.overwrite_header({
            'content-type': "multipart/form-data; boundary=---011000010111000001101001",
            'host': self.store_link,
            'connection': "keep-alive",
            'accept': "application/json, text/javascript, */*; q=0.01",
            'origin': "http://" + self.store_link,
            'x-requested-with': "XMLHttpRequest",
            'referer': "http://" + self.store_link + "/webapp/wcs/stores/servlet/TBWizardView?catalogId=10001&langId=-1&storeId=" + self.store_id,
            })
        textbook_payload = self.textbook_payload
        for semester in self.semesters:
            for department in semester.departments:
                for course in department.courses:
                    for section in course.sections:
                        self.num_textbooks += 1
                        textbook_payload = self.add_textbook(section.id, textbook_url, textbook_payload, False)
        if self.num_textbooks != self.max_textbooks:
            textbook_payload = self.add_textbook(section.id, textbook_url, textbook_payload, True)

    def add_textbook(self, section_id, textbook_url, textbook_payload, force_request):
        if self.num_textbooks == self.max_textbooks or force_request:
            textbook_payload += "--"
            soup = self.requester.post(textbook_url, form=textbook_payload, throttle=lambda:randint(300, 500))
            self.parse_textbooks(soup)
            self.num_textbooks = 0
            return self.textbook_payload
        return textbook_payload + "\r\nContent-Disposition: form-data; name=\"section_" + str(self.num_textbooks) + "\"\r\n\r\n" + str(section_id) + "\r\n-----011000010111000001101001"

    def parse_textbooks(self,soup):
        textbooks = soup.findAll('div', class_='book_details')
        textbook_sections = soup.findAll('div',class_="book_sec")
        print "( Request #: " + str(self.book_request_count) + ") " + str(len(textbooks)) + " textbooks found."
        self.book_request_count += 1
        self.last_num_found = len(textbooks)
        for tbsec in textbook_sections:
            raw_code = tbsec.findAll('h1')[0]
            code_list = raw_code.get_text().split()[:-2]
            course_code = self.delimeter.join(code_list[:-1])
            if len(code_list[2]) == 1:
                section = "(0" + code_list[2] + ")"
            else:
                section = "(" + code_list[2] + ")"
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
        try:
            course = Course.objects.filter(code__contains = course_code, school = self.school)[0]
            print(course)
        except IndexError:
            print("index error (course does not exist): " + course_code)
            return
        sections = Section.objects.filter(course = course, meeting_section = section)
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
        for section in sections:
            section, created = self.textbook_link.objects.update_or_create(
                is_required = is_required,
                section = section,
                textbook = textbook
            )

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

    def check_required(self,html):
        if html.find("REQUIRED") != -1:
            return True
        else:
            return False