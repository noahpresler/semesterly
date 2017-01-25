# @what     JHU Course Parser
# @org      Semeseter.ly
# @author   Noah Presler
# @date     1/24/17

from scripts.parser_library.Base import CourseParser

class HopkinsParser(CourseParser):

    API_URL = 'https://isis.jhu.edu/api/classes/'
    KEY = '***REMOVED***'
    DAY_TO_LETTER_MAP = {'m': 'M',
        't': 'T',
        'w': 'W',
        'th': 'R',
        'f': 'F',
        'sa': 'S',
        's': 'U'}

    def __init__(self,school,sem="Spring 2017"):
        CourseParser.__init__(self, school)
        self.schools = []
        self.semester = sem

    def get_schools(self):
        url = API_URL + '/codes/schools?key=' + KEY
        self.schools = self.requester.get(url=url)

    def get_courses(self,school):
        print "Getting courses in: " + school['Name']
        url = API_URL + '/' + school['Name'] + '/'+ self.semester + '?key=' + KEY
        return self.requester.get(url=url)

    def get_section(self,course):
        url = API_URL + '/' + course['OfferingName'].replace(".", "") + course['SectionName'] +'/' + self.semester + '?key=' + KEY
        return self.requester.get(url=url)

    def parse_schools(self):
        for school in self.schools:
            self.parse_school(school)

    def parse_school(self,school):
        courses = self.get_courses(school)
        for course in courses:
            section = self.get_section(course)
            try:
                self.load_ingestor(course,section)
            except:
                print "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
                traceback.print_tb(sys.exc_info()[2], file=sys.stdout)

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
        self.ingest['areas'] = course['Areas'].split(',')
        self.ingest['areas'] += ['Writing Intensive'] if course['IsWritingIntensive'] == "Yes" else []
        self.ingest['prerequisites'] = SectionDetails[0].get('Prerequisites',{})[0].get('Description','')
        self.ingest['level'] = re.findall(re.compile(r".+?\..+?\.(.{1}).+"),course['OfferingName'])[0] + "00"
        self.ingest['descrption'] = SectionDetails[0]['Description']
        self.ingest['code'] = course['OfferingName'].strip()
        self.ingest['num_credits'] = num_credits
        self.ingest['department'] = course['Department']
        self.ingest['campus'] = 1

        # Add specialty areas for computer science department
        if course['Department'] == 'EN Computer Science':
            cs_areas_regex = r'\bApplications|\bAnalysis|\bSystems|\bGeneral'
            for match in re.findall(cs_areas_regex,description):
                self.ingest['areas'] += [match]

        created_course = self.ingest.create_course()

        for meeting in SectionDetails[0]['Meetings']:
            # Load core section fields
            self.ingest['section'] = "(" + section[0]['SectionName'] + ")"
            self.ingest['semester'] = self.semester[0].upper()
            self.ingest['instructors'] = course['Instructors']
            self.ingest['size'], self.ingest['enrolment'] = self.compute_size_enrollment(coure)

            created_section = self.ingest.create_section(created_course)

            #load offering fields
            times = Meeting['Times']
            for time in filter(lambda t: len(t) > 0, times.split(',')):
                time_pieces = re.search(r"(\d\d:\d\d [AP]M) - (\d\d:\d\d [AP]M)",time)
                self.ingest['time_start'] = self.extract.time_12to24(time_pieces.group(1))
                self.ingest['time_end'] = self.extract.time_12to24(time_pieces.group(2))
                if meeting['DOW'] != "TBA" and meeting['DOW'] !="None":
                    self.ingest['days'] = re.findall(r"([A-Z][a-z]*)+?",days)
                    self.ingest['location'] = {
                        'building' : meeting['Building'],
                        'room' : meeting['Room']
                    }
                created_meeting = self.ingest.create_offerings(created_section)

    def start(self):
        self.get_schools()
        self.parse_schools()
        self.wrap_up()