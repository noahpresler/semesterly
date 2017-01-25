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

    def __init__(self,school):
        CourseParser.__init__(self, school)
        self.schools = []

    def get_schools(self):
        url = API_INFO.url + '/codes/schools?key=' + API_INFOP.key
        self.schools = self.get_json(url)

    def get_courses(self,school):
        print "Getting courses in: " + school['Name']
        url = API_URL + '/' + school['Name'] + '/'+ self.semester + '?key=' + KEY
        courses = self.get_json(url)
        return courses

    def get_section(self,course):
        url = API_URL + '/' + course['OfferingName'].replace(".", "") + course['SectionName'] +'/' + self.semester + '?key=' + KEY
        return self.get_json(url)

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

    def load_ingestor(self,course,section):
        SectionDetails = section[0]['SectionDetails']
        Meetings = SectionDetails[0]['Meetings']
        SectionCode = section[0]['SectionName']
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

        course = self.ingest.create_course()

        # Load core section fields
        self.ingest['code']

    def start(self):
        self.get_schools()
        self.parse_schools()
        self.wrap_up()