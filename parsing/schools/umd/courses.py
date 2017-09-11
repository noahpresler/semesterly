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

import re

from parsing.library.base_parser import BaseParser


class Parser(BaseParser):
    def __init__(self, sem="Fall", year="2017", **kwargs):
        self.semester = sem
        self.year = year
        self.last_course = {}
        self.last_section = {}
        self.base_url = "http://ntst.umd.edu/soc/"
        self.prereq_pattern = re.compile(r'Prerequisite:.*')
        self.restr_pattern = re.compile(r'Restriction: :.*')
        super(Parser, self).__init__('umd', **kwargs)

    def find_content(self, div_class, parent):
        try:
            return parent.find(class_=div_class).contents[0].strip()
        except:
            return ''

    def find_url(self, div_class, parent):
        try:
            return parent.find(class_=div_class)['href']
        except:
            return ''

    def find_cores(self, tag, parent):
        try:
            cores = []
            core_div = parent.find(tag, text=re.compile(r"CORE:")).parent
            core_links = core_div.findAll("a")
            for core_link in core_links:
                cores.append(core_link.contents[0].strip())
            return cores
        except:
            return []

    def find_gens(self, div_class, parent):
        try:
            gen_spans = parent.findAll(class_=div_class)
            geneds = []
            for gen_span in gen_spans:
                geneds.append(gen_span.find("a").contents[0].strip())
            return geneds
        except:
            return []

    def get_desc_from_course(self, course):
        try:
            return course.find_all(class_='approved-course-text')[-1].contents[0].strip()
        except:
            return ''

    def get_departments(self):
        """Get department in the specified semester in specified year."""
        # HARD CODED
        semester_map = {'Fall': '08', 'Spring': '01'}

        soup = self.requester.get(url=self.base_url)
        prefix_rows = soup.findAll(class_='course-prefix row')
        prefix_a_tags = []
        departments = {}
        for row in prefix_rows:
            prefix_a_tags.append(row.find('a'))
        for link in prefix_a_tags:
            spans = link.findAll('span')
            department_url = spans[0].string
            department_name = spans[1].string
            if self.semester == None or self.year == None:
                partial_url = department_url
            else:
                semester_month = semester_map[self.semester]
                partial_url = str(self.year) + semester_month + "/" + department_url
            departments[self.base_url + partial_url] = department_name
        return departments

    def get_prerequisites(self, course):
        prereq_match = course.find('strong', text=self.prereq_pattern)
        prereq = ''
        if prereq_match:
            prereq = prereq_match.parent.get_text().strip().replace('Prerequisite:', '')
        restr_match = course.find('strong', text=self.restr_pattern)
        if restr_match:
            prereq += ' ' + restr_match.parent.get_text().strip().replace('Restriction: ', '')
        return prereq

    def get_courses(self, departments):
        num_created, num_updated = 0, 0
        for department_url, department_name in list(departments.items()):
            soup = self.requester.get(url=department_url)
            course_div = soup.findAll(class_="course")
            for c in course_div:
                cid = self.find_content("course-id", c)
                partial_url = self.find_url("toggle-sections-link", c)
                if (partial_url == ''):
                    continue

                name = self.find_content("course-title", c)
                credits = int(self.find_content("course-min-credits", c))
                description = self.get_desc_from_course(c)

                cores = []
                cores = self.find_cores("span", c)

                geneds = []
                geneds = self.find_gens("course-subcategory", c)

                level = re.findall(re.compile(r"^\D*(\d)"), cid)[0] + "00"

                self.ingestor['cores'] = cores
                self.ingestor['geneds'] = geneds
                self.ingestor['level'] = level
                self.ingestor['name'] = name
                self.ingestor['description'] = description
                self.ingestor['code'] = cid
                self.ingestor['num_credits'] = credits
                self.ingestor['department_name'] = department_name
                self.ingestor['campus'] = 1
                self.ingestor['prerequisites'] = self.get_prerequisites(c)

                course_model = self.ingestor.ingest_course()

                section_url = "http://ntst.umd.edu" + partial_url
                self.get_sections(section_url, course_model)

    def get_sections(self, section_url, course_model):
        soup = self.requester.get(url=section_url)
        container = soup.find(class_="sections-container")
        section_divs = container.findAll(class_="section")
        for div in section_divs:
            sid = self.find_content("section-id", div)

            instructors = []
            instructors_div = div.findAll(class_="section-instructor")
            for instructor_div in instructors_div:
                instructor_link = instructor_div.find("a")
                if instructor_link is not None:
                    instructors.append(instructor_link.contents[0].strip())
                else:
                    instructors.append(instructor_div.contents[0].strip())

            day = self.find_content("section-days", div)
            start_time = self.find_content("class-start-time", div)
            end_time = self.find_content("class-end-time", div)
            building = self.find_content("building-code", div)
            room = self.find_content("class-room", div)
            total_seats = self.find_content("total-seats-count", div)
            open_seats = self.find_content("open-seats-count", div)
            waitlist = self.find_content("waitlist-count", div)

            self.ingestor['section'] = sid
            self.ingestor['semester'] = self.semester
            self.ingestor['instructors'] = instructors
            self.ingestor['capacity'] = int(total_seats)
            self.ingestor['enrollment'] = int(total_seats) - int(open_seats)
            self.ingestor['waitlist'] = int(waitlist)
            self.ingestor['year'] = self.year

            section_model = self.ingestor.ingest_section(course_model)

            days = day.replace('Tu', 'T').replace('Th', 'R')
            valid_days = set(["M", "T", "W", "R", "F", "S", "U"])
            for day in days:
                if day not in valid_days or not start_time or not end_time:
                    continue
                self.ingestor['day'] = day
                self.ingestor['time_start'] = start_time
                self.ingestor['time_end'] = end_time
                self.ingestor['location'] = building + room
                self.ingestor.ingest_meeting(section_model)

    def start(self,
              years_and_terms_filter=None,
              departments_filter=None,
              textbooks=True,
              verbosity=3):
        """Start the parse."""
        for year, terms in years_and_terms_filter.items():
            self.year = year
            for term in terms:
                self.semester = term
                departments = self.get_departments()
                self.get_courses(departments)
