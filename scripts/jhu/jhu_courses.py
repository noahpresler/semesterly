# @what     JHU Course Parser
# @org      Semeseter.parser_library
# @author   Noah Presler
# @date     1/24/17

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import re, sys
from scripts.parser_library.base_parser import CourseParser

class HopkinsParser(CourseParser):

    API_URL = 'https://isis.jhu.edu/api/classes/'
    KEY = 'evZgLDW987P3GofN2FLIhmvQpHASoIxO'
    DAY_TO_LETTER_MAP = {'m': 'M',
        't': 'T',
        'w': 'W',
        'th': 'R',
        'f': 'F',
        'sa': 'S',
        's': 'U'}

    def __init__(self, **kwargs):
        self.schools = []
        self.last_course = {}
        super(HopkinsParser, self).__init__('jhu',**kwargs)

    def get_schools(self):
        url = HopkinsParser.API_URL + '/codes/schools?key=' + HopkinsParser.KEY
        self.schools = self.requester.get(url)

    def get_courses(self,school):
        if self.verbosity >= 1:
            print("Getting courses in: " + school['Name'])
        url = HopkinsParser.API_URL + '/' + school['Name'] + '/'+ self.semester + '?key=' + HopkinsParser.KEY
        return self.requester.get(url)

    def get_section(self,course):
        return self.requester.get(get_section_url(course))

    def get_section_url(self, course):
        return HopkinsParser.API_URL + '/' + course['OfferingName'].replace(".", "") + course['SectionName'] +'/' + self.semester + '?key=' + HopkinsParser.KEY

    def parse_schools(self):
        for school in self.schools[:1]:
            self.parse_school(school)

    def parse_school(self,school):
        courses = self.get_courses(school)
        for course in courses:
            section = self.get_section(course)
            if len(section) == 0:
                with open('scripts/jhu/logs/section_url_tracking.txt', 'w') as f:
                    print(get_section_url, file=f)
                continue
            self.load_ingestor(course,section)

    def compute_size_enrollment(self,course):
        try:
            section_size = int(course['MaxSeats'])
        except:
            section_size = 0
        try:
            section_enrolment = section_size - int(course['SeatsAvailable'].split("/")[0])
            if section_enrolment < 0:
                section_enrolment = 0
        except:
            section_enrolment = 0
        return (section_size,section_enrolment)

    def load_ingestor(self,course,section):
        SectionDetails = section[0]['SectionDetails']
        try:
            num_credits=int(float(course['Credits']))
        except:
            num_credits=0

        # Load core course fields
        self.ingestor['areas'] = filter(lambda a: a != "None", course['Areas'].split(','))
        self.ingestor['areas'] += ['Writing Intensive'] if course['IsWritingIntensive'] == "Yes" else []
        # if len(SectionDetails[0]['Prerequisites']) > 0:
            # print ':::'.join(p['Description'] for p in SectionDetails[0]['Prerequisites'])
        # if len(SectionDetails[0]['Corequisites']) > 0:
        #     print SectionDetails[0]['Corequisites']
        self.ingestor['prerequisites'] = ' '.join(p['Description'] for p in SectionDetails[0]['Prerequisites']) if len(SectionDetails[0]['Prerequisites']) > 0 else ''
        self.ingestor['level'] = re.findall(re.compile(r".+?\..+?\.(.{1}).+"),course['OfferingName'])[0] + "00"
        self.ingestor['name'] = self.extractor.titlize(course['Title'])
        self.ingestor['description'] = SectionDetails[0]['Description']
        self.ingestor['code'] = course['OfferingName'].strip()
        self.ingestor['num_credits'] = num_credits
        self.ingestor['department_name'] = course['Department']
        self.ingestor['campus'] = 1
        if SectionDetails[0].get('EnrollmentRestrictedTo'):
            self.ingestor['exclusions'] = SectionDetails[0].get('EnrollmentRestrictedTo')

        # Add specialty areas for computer science department
        if course['Department'] == 'EN Computer Science':
            cs_areas_regex = r'\bApplications|\bAnalysis|\bSystems|\bGeneral'
            for match in re.findall(cs_areas_regex,self.ingestor['description']):
                self.ingestor['areas'] += [match]

        created_course = self.ingestor.ingest_course()
        if self.last_course and created_course['code'] == course['OfferingName'].strip() and created_course['name'] != course['Title']:
            self.ingestor['section_name'] = course['OfferingName'].strip()
        self.last_course = created_course

        for meeting in SectionDetails[0]['Meetings']:
            # Load core section fields
            self.ingestor['section'] = "(" + section[0]['SectionName'] + ")"
            self.ingestor['semester'] = self.semester.split()[0]
            self.ingestor['instructors'] = map(lambda i: i.strip(), course['Instructors'].split(','))
            self.ingestor['size'], self.ingestor['enrollment'] = self.compute_size_enrollment(course)
            self.ingestor['year'] = self.semester.split()[1]

            created_section = self.ingestor.ingest_section(created_course)

            #load offering fields
            times = meeting['Times']
            for time in filter(lambda t: len(t) > 0, times.split(',')):
                time_pieces = re.search(r"(\d\d:\d\d [AP]M) - (\d\d:\d\d [AP]M)",time)
                self.ingestor['time_start'] = self.extractor.time_12to24(time_pieces.group(1))
                self.ingestor['time_end'] = self.extractor.time_12to24(time_pieces.group(2))
                if len(meeting['DOW'].strip()) > 0 and meeting['DOW'] != "TBA" and meeting['DOW'] !="None":
                    self.ingestor['days'] = map(lambda d: HopkinsParser.DAY_TO_LETTER_MAP[d.lower()], re.findall(
                        r"([A-Z][a-z]*)+?", meeting['DOW']
                    ))
                    self.ingestor['location'] = {
                        'building' : meeting['Building'],
                        'room' : meeting['Room']
                    }
                    created_meeting = self.ingestor.ingest_offerings(created_section)

    def start(self,
        years=None,
        terms=None,
        departments=None,
        textbooks=True,
        verbosity=3,
        **kwargs):

        self.verbosity = verbosity

        # Defualt to hardcoded current year.
        if not years:
            years = ['2017', '2016']
        if not terms:
            terms = ['Spring', 'Fall']

        # Run parser for all semesters specified.
        for year in years:
            for term in terms:
                print('{} {}'.format(term, year))
                self.semester = '{} {}'.format(term, str(year))
                self.get_schools()
                self.parse_schools()

if __name__ == "__main__":
    raise NotImplementedError('run parsers with manage.py')
