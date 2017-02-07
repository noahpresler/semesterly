# @what     JHU Course Parser
# @org      Semeseter.parser_library
# @author   Noah Presler
# @date     1/24/17
import sys
from scripts.parser_library.BaseParser import *

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

    def __init__(self,sem="Spring 2017",**kwargs):
        # CourseParser.__init__(self, school)
        self.schools = []
        self.semester = sem
        self.last_course = {}
        self.last_section = {}
        self.department = None
        super(HopkinsParser, self).__init__('jhu',**kwargs)

    def get_schools(self):
        if self.department:
            self.schools = [{'Name': self.department}]
        else:
            url = HopkinsParser.API_URL + '/codes/schools?key=' + HopkinsParser.KEY
            self.schools = self.requester.get(url=url)

    def get_courses(self,school):
        print "Getting courses in: " + school['Name']
        url = HopkinsParser.API_URL + '/' + school['Name'] + '/'+ self.semester + '?key=' + HopkinsParser.KEY
        return self.requester.get(url=url)

    def get_section(self,course):
        url = HopkinsParser.API_URL + '/' + course['OfferingName'].replace(".", "") + course['SectionName'] +'/' + self.semester + '?key=' + HopkinsParser.KEY
        return self.requester.get(url=url)

    def parse_schools(self):
        for school in self.schools:
            self.parse_school(school)

    def parse_school(self,school):
        courses = self.get_courses(school)
        for course in courses:
            section = self.get_section(course)
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
        self.ingestor['prerequisites'] = SectionDetails[0]['Prerequisites'][0].get('Description','') if len(SectionDetails[0]['Prerequisites']) > 0 else ''
        self.ingestor['level'] = re.findall(re.compile(r".+?\..+?\.(.{1}).+"),course['OfferingName'])[0] + "00"
        self.ingestor['descrption'] = SectionDetails[0]['Description']
        self.ingestor['code'] = course['OfferingName'].strip()
        self.ingestor['num_credits'] = num_credits
        self.ingestor['department_name'] = course['Department']
        self.ingestor['campus'] = 1

        # Add specialty areas for computer science department
        if course['Department'] == 'EN Computer Science':
            cs_areas_regex = r'\bApplications|\bAnalysis|\bSystems|\bGeneral'
            for match in re.findall(cs_areas_regex,description):
                self.ingestor['areas'] += [match]

        # print "LAST " + str(self.last_course.get('code', None)) + " NEW " + str(self.ingestor['code']) + " CREATING " + str(self.last_course.get('code', None) != self.ingestor['code'])
        created_course = self.ingestor.ingest_course()

        for meeting in SectionDetails[0]['Meetings']:
            # Load core section fields
            self.ingestor['section'] = "(" + section[0]['SectionName'] + ")"
            self.ingestor['semester'] = self.semester.split()[0]
            self.ingestor['instructors'] = map(lambda i: i.strip(), course['Instructors'].split(','))
            self.ingestor['size'], self.ingestor['enrolment'] = self.compute_size_enrollment(course)
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
        year=None,
        term=None,
        department=None,
        textbooks=True,
        verbosity=3,
        **kwargs):
        if year and term:
            self.semester = term + " " + str(year)
        if department:
            self.department = department
        self.get_schools()
        self.parse_schools()
        self.ingestor.wrap_up()

if __name__ == "__main__":
    parser = HopkinsParser()
    parser.start()