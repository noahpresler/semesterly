import re
import os
import bs4
from datetime import datetime
import logging
from queens_config import LOG_DIR

class SolusParser(object):
    """Parses SOLUS's crappy HTML"""

    # For getting the correct tags
    ALL_SUBJECTS = re.compile("DERIVED_SSS_BCC_GROUP_BOX_1\$147\$\$[0-9]+")
    ALL_COURSES = re.compile("CRSE_NBR\$[0-9]+")
    
    ALL_CAREERS = re.compile("CAREER\$[0-9]+")

    ALL_SECTIONS = re.compile("CLASS_SECTION\$[0-9]+")
    ALL_SECTION_TABLES = re.compile("CLASS\$scroll\$[0-9]+")

    # For getting information out of the page
    SUBJECT_INFO = re.compile("^\s*([^-\s]*)\s+-\s+(.*)$") # Abbreviation - Subject
    COURSE_INFO = re.compile("^([\S]+)\s+([\S]+)\s+-\s+(.*)$") # Abbreviation Code - Name
    TERM_INFO = re.compile("^([^\s]+)\s+(.+)$") # 2013 Fall
    SECTION_INFO = re.compile("(\S+)-(\S+)\s+\((\S+)\)") #001-LEC (1234)
    TIME_INFO = re.compile("(\d+:\d+[AP]M)") #1:30PM
    DATE_INFO = re.compile("^([\S]+)\s*-\s*([\S]+)$") #yyyy/mm/dd - yyyy/mm/dd

    def __init__(self):
        self.soup = None
        self._souplib = 'lxml'

        # Prefer lxml, fall back to built in parser
        try:
            bs4.BeautifulSoup("", self._souplib)
        except bs4.FeatureNotFound as e:
            logging.warning(u"Not using {0} for parsing, using builtin parser instead".format(self._souplib))
            self._souplib = "html.parser"

    def update_html(self, text):
        """Feed new data to the parser"""
        self.soup = bs4.BeautifulSoup(text, self._souplib)

    def dump_html(self):
        """Dumps the contents of the parser to a file"""
        logging.critical("Encountered exception, attempting to dump the HTML")

        fname_template = "temp%d.html"
        i = 0
        filename = os.path.join(LOG_DIR, fname_template % i)
        while os.path.exists(os.path.join(LOG_DIR, fname_template % i)):
            i += 1
            filename = os.path.join(LOG_DIR, fname_template % i)

        with open(filename, "wb") as f:
            f.write(self.soup.prettify().encode("utf-8"))

        logging.critical("Dumped html to %s" % filename)

    def _clean_html(self, text):
        return text.replace('&nbsp;', ' ').strip()

    #-----------------------Logins----------------------------

    def login_solus_link(self):
        """Return the href of the SOLUS link"""
        link = self.soup.find("a", text="SOLUS")
        if not link:
            return None
        else:
            return link.get("href")

    def login_continue_page(self):
        """Return the url and payload to post from the continue page"""

        #Grab the RelayState, SAMLResponse, and POST url
        form = self.soup.find("form")
        if not form:
            # No form, nothing to be done
            return None
        url = form.get("action")

        payload = {}
        for x in form.find_all("input", type="hidden"):
            payload[x.get("name")] = x.get("value")

        return dict(url=url, payload=payload)

    #---------------------Get actions from uniques-----------------------

    def subject_action(self, subject_unique):
        """Return the action for the subject unique"""

        # XXX: Less dirty hack
        # Using 'find(text="blah")' compares "blah" against the '.string' property of tag candidates, not the '.text' property
        # This can be seen here: http://bazaar.launchpad.net/~leonardr/beautifulsoup/bs4/view/head:/bs4/element.py#L1520
        # This breaks searching for text in tags with child tags.
        # A workaround is to use a custom function to explicitly match the text
        # There is an open bug for this behaviour at https://bugs.launchpad.net/beautifulsoup/+bug/1366856
        # Once the bug is fixed, the original code should be put back (it's faster and cleaner)

        # tag = self.soup.find("a", id=self.ALL_SUBJECTS, text=subject_unique)
        def match_subject(tag):
            return tag.name == "a" and tag.text == subject_unique and self.ALL_SUBJECTS.match(tag["id"]) is not None if hasattr(tag, "id") else False
        tag = self.soup.find(match_subject)

        if not tag:
            logging.warning(u"Couldn't find the subject '{0}'".format(subject_unique))
            return None

        return tag["id"]

    def course_action(self, course_unique):
        """Return the action for the course unique"""
        tag = self.soup.find("a", id=self.ALL_COURSES, text=course_unique)

        if not tag:
            logging.warning(u"Couldn't find the course '{0}'".format(course_unique))
            return None

        return tag["id"]

    def disambiguation_action(self):
        """return the action for the last course on the disambiguation course. using the last course is not great but in the cases I found, it's always the most standard one"""
        tags = self.soup.find_all("a", id=self.ALL_CAREERS)

        if not tags:
            return None

        return tags[-1]["id"]

    def term_value(self, term_unique):
        """Return the value for the term unique"""
        dropdown = self.soup.find("select", id="DERIVED_SAA_CRS_TERM_ALT")
        if not dropdown:
            raise Exception("Couldn't find a term dropdown")

        tag = dropdown.find("option", text=term_unique)
        if not tag:
            logging.warning(u"Couldn't find the term '{0}'".format(term_unique))
            return None

        return tag["value"]

    def section_action(self, section_unique):
        """Return the action of the section unique"""
        tag = self.soup.find("a", id=self.ALL_SECTIONS, text=section_unique)
        if not tag:
            logging.warning(u"Couldn't find section '{0}'".format(section_unique))
            return None

        return tag["id"]

    def show_sections_action(self):
        """Returns the action to show sections, `None` if not needed"""
        link_id = "DERIVED_SAA_CRS_SSR_PB_GO"
        if self.soup.find("a", id=link_id):
            return link_id
        return None

    def view_all_action(self):
        """Returns the action to view all sections, `None` if not needed"""
        link_id = "CLASS_TBL_VW5$fviewall$0"
        a_tag = self.soup.find("a", id=link_id)
        if a_tag and a_tag.get_text() == 'View All':  # We have to check the text, as sometimes the opening persists
            return link_id
        return None

    #--------------------------Get all uniques (and basic data)---------------------

    def all_subjects(self, start=0, end=None, step=1):
        """Returns a list of dicts containing the name, abbreviation, and unique of the subjects"""

        # Find all subjects on the page
        tags = self.soup.find_all("a", id=self.ALL_SUBJECTS)

        # Figure out the ending point
        if end is None:
            end = len(tags)
        else:
            end = min(end, len(tags))

        ret = []
        # Loop over the links and extract the information
        for i in range(start, end, step):

            # Extract the subject title and abbreviation
            m = self.SUBJECT_INFO.search(self._clean_html(tags[i].get_text()))
            if not m:
                logging.warning("Couldn't extract title and abbreviation from dropdown")
                continue

            abbr = m.group(1)
            title = m.group(2)

            # Add the discovered information to the return list
            ret.append(dict(title=title, abbreviation=abbr, _unique=tags[i].get_text()))

        return ret

    def all_courses(self, start=0, end=None, step=1):
        """Returns a list of all the uniques of the courses"""

        # Find all course tags
        tags = self.soup.find_all("a", id=self.ALL_COURSES)

        # Figure out the ending point
        if end is None:
            end = len(tags)
        else:
            end = min(end, len(tags))

        ret = []
        for i in range(start, end, step):
            ret.append(tags[i].get_text())

        return ret

    def all_terms(self):
        """
        Returns a list of dicts containing term data (year, season, _unique) in the current course.
        Returns an empty list if the class isn't scheduled
        """

        DROPDOWN_ID = "DERIVED_SAA_CRS_TERM_ALT"

        term_sel = self.soup.find("select", id=DROPDOWN_ID)

        ret = []
        # Check if class is scheduled
        if term_sel:
            for x in term_sel.find_all("option"):
                m = self.TERM_INFO.search(x.get_text())
                if not m:
                    logging.warning("Couldn't extract data from term dropdown")
                    continue

                ret.append(dict(year=m.group(1), season=m.group(2), _unique=x.get_text()))

        return ret

    def all_section_data(self):
        """
        Returns a list of all the sections data

        Format:
        [
            {
                "_unique": The text on the link
                "basic": {
                    "class_num": Class number
                    "solus_id": Numeric id
                    "type": LEC, LAB, etc
                    "status": (open/closed)
                },
                "classes": [
                    {
                        'day_of_week': 1-7, starting with monday
                        'start_time': datetime.time object
                        'end_time': datetime.time object
                        'location': room
                        'instructors': [instructor names]
                        'term_start': datetime.date object
                        'term_end': datetime.date object
                    }, ...
                ]
            }, ...
        ]
        """

        LINK_FORMAT = "CLASS_SECTION${0}"

        tables = self.soup.find_all("table", id=self.ALL_SECTION_TABLES)

        ret = []
        # Iterate over all the tables
        for i in range(len(tables)):

            section_data = {}
            basic = {}

            # Get the basic section information (class number, solus id, type)
            link_tag = tables[i].find("a", id=LINK_FORMAT.format(i))
            if link_tag:
                m = self.SECTION_INFO.search(link_tag.get_text())
                if m:
                    basic["solus_id"] = m.group(1)
                    basic["type"] = m.group(2)
                    basic["class_num"] = m.group(3)
                    section_data["_unique"] = link_tag.get_text()
                else:
                    logging.warning("Found section link but couldn't extract information from it")
                    continue
            else:
                logging.warning("Couldn't find the section link at the specified index")
                continue

            # Get the open/closed status
            stats = ("Open", "Closed")
            for status in stats:
                if tables[i].find("img", alt=status):
                    basic["status"] = status
                    break
            else:
                logging.warning("Couldn't find open/closed status on shallow scrape")
                basic["status"] = None

            # Get class data for the section
            section_attrs = self.section_attrs_at_index(i)
            if section_attrs is None:
                logging.warning("Couldn't find section at specified index")
                continue

            section_data["classes"] = section_attrs
            section_data["basic"] = basic

            # Add the section information to the returned list
            ret.append(section_data)

        return ret

    #-----------------------Page parsing methods-----------------------------

    def course_attrs(self):
        """Parses the course attributes out of the page

        Return format:

        {
            'basic':{
                'title': course title,
                'number': course number,
                'description: course description,
            }
            'extra':{
                # All keys in `KEYMAP` are valid in here (direct mapping)
                # course_components is a special case
                'course_components':{
                    # Example
                    'Lecture': 'Required',
                }
                "CEAB":{
                    # Example
                    'Math': '30',
                }
            }
        }
        """

        TITLE_CLASS = "PALEVEL0SECONDARY"
        INFO_BOX_CLASS = "PSGROUPBOXNBO"
        INFO_BOX_HEADER_CLASS = "SSSGROUPBOXLTBLUE"
        DESCRIPTION_CLASS = "PSLONGEDITBOX"

        EDITBOX_LABEL_CLASS = "PSEDITBOXLABEL"
        EDITBOX_DATA_CLASS = "PSEDITBOX_DISPONLY"
        DROPDOWN_LABEL_CLASS = "PSDROPDOWNLABEL"
        DROPDOWN_DATA_CLASS = "PSDROPDOWNLIST_DISPONLY"

        DESCRIPTION = "Description"
        COURSE_DETAIL = "Course Detail"
        COURSE_COMPS = "Course Components"
        ENROLL_INFO = "Enrollment Information"
        CEAB = "CEAB Units"

        KEYMAP = {
            "Career": "career",
            "Typically Offered": "typically_offered",
            "Units": "units",
            "Grading Basis": "grading_basis",
            "Add Consent": "add_consent",
            "Drop Consent": "drop_consent",
            "Course Components": "course_components",
            "Enrollment Requirement": "enrollment_requirement",
        }

        ret = {
            'extra':{
            }
        }

        # Get the title and number
        title = self.soup.find("span", {"class": TITLE_CLASS})
        if not title:
            raise Exception("Could not find the course title to parse")

        temp = self._clean_html(title.string)

        m = self.COURSE_INFO.search(temp)
        if not m:
            raise Exception(u"Title found ({0}) didn't match regular expression".format(temp))

        ret['basic'] = {
            'title' : m.group(3),
            'number' : m.group(2),
            'description' : ""
        }

        # Look through inner tables
        info_boxes = self.soup.find_all("table", {"class": INFO_BOX_CLASS})
        for table in info_boxes:

            # Get the table type
            temp = table.find("td", {"class": INFO_BOX_HEADER_CLASS})
            if not temp or not temp.string:
                # Nothing there
                continue

            box_title = temp.string

            # Process the description box
            if box_title == DESCRIPTION:
                desc_list = table.find("span", {"class": DESCRIPTION_CLASS}).contents
                if desc_list:
                    # If not x.string, it means it's a <br/> Tag
                    ret['basic']['description'] = "\n".join([x for x in desc_list if x.string])

            # Process the course details and enrollment info
            elif box_title in (COURSE_DETAIL, ENROLL_INFO):

                # Labels and values for "Add/Drop Consent" (enroll), "Career" (course), and "Grading Basis" (course)
                labels = table.find_all("span", {"class": DROPDOWN_LABEL_CLASS})
                data = table.find_all("span", {"class": DROPDOWN_DATA_CLASS})

                if box_title == ENROLL_INFO:
                    # Labels and values for "Typically Offered", "Enrollment Requirement",
                    labels += table.find_all("span", {"class": EDITBOX_LABEL_CLASS})
                    data += table.find_all("span", {"class": EDITBOX_DATA_CLASS})

                # Add all the type -> value mappings to the ret dict
                for x in range(0, len(labels)):
                    if labels[x].string in KEYMAP:
                        ret['extra'][KEYMAP[labels[x].string]] = data[x].get_text()

                # Special case for course detail, "Units" and "Course Components"
                if box_title == COURSE_DETAIL:
                    # Units and course components
                    labels = table.find_all("span", {"class": EDITBOX_LABEL_CLASS})
                    
                    data = table.find_all("span", {"class": EDITBOX_DATA_CLASS})

                    dataIndex = 0
                    for x in range(0, len(labels)):
                        if labels[x].string == COURSE_COMPS:
                            # Last datafield, has multiple type -> value mappings
                            comp_map = {}
                            for i in range(x, x+(len(data)-len(labels)), 2):
                                comp_map[data[i].string] = data[i+1].get_text()
                                #data index is lock-step with x until the course components, then it starts after the last component. (and is ahead of x)
                                dataIndex = i+2

                            ret['extra'][KEYMAP[labels[x].string]] = comp_map
                            continue
                        elif labels[x].string in KEYMAP:
                            ret['extra'][KEYMAP[labels[x].string]] = data[dataIndex].get_text()
                            dataIndex+=1

            # Process the CEAB information
            elif box_title == CEAB:

                labels = table.find_all("span", {"class": EDITBOX_LABEL_CLASS})
                data = table.find_all("span", {"class": EDITBOX_DATA_CLASS})

                for x in range(0, len(labels)):
                    try:
                        # Clean up the data
                        temp = int(self._clean_html(data[x].string))
                    except (TypeError, ValueError) as e:
                        temp = 0

                    # Add the data to the dict if it exists
                    if labels[x].string:
                        if not 'CEAB' in ret['extra']:
                            ret['extra']['CEAB'] = {}

                        # Remove the last character of the label to remove the ":"
                        ret['extra']['CEAB'][labels[x].string[:-1]] = temp

            else:
                raise Exception(u"Encountered unexpected info_box with title: '{0}'".format(box_title))

        return ret

    def section_attrs_at_index(self, index):
        """
        Returns a list containing class information for the specified section index on the page.

        Used for shallow scrapes.

        Return format:
        [
            {
                'day_of_week': 1-7, starting with monday, None for 'TBA' and other
                'start_time': datetime.time object
                'end_time': datetime.time object
                'location': room
                'instructors': [instructor names]
                'term_start': datetime.date object
                'term_end': datetime.date object
            },
        ]
        """

        # Map the strings to numeric days
        DAY_MAP = {
            "mo": 1,
            "tu": 2,
            "we": 3,
            "th": 4,
            "fr": 5,
            "sa": 6,
            "su": 7
        }

        TABLE_ID = "CLASS_MTGPAT$scroll${0}"
        CELL_CLASS = "PSEDITBOX_DISPONLY"
        INSTRUCTOR_CELL_CLASS = "PSLONGEDITBOX"

        NON_INSTRUCTORS = ("TBA", "Staff")

        data_table = self.soup.find("table", id=TABLE_ID.format(index))
        if not data_table:
            return None

        # Get the needed cells
        cells = data_table.find_all("span", {"class": CELL_CLASS})
        inst_cells = data_table.find_all("span", {"class": INSTRUCTOR_CELL_CLASS})

        # Deal with bad formatting
        values = [self._clean_html(x.string) for x in cells]

        # Iterate over all the classes
        ret = []
        for x in range(0, len(values), 5):

            # Instructors
            temp_inst = inst_cells[x//5].string
            instructors = []
            if temp_inst and temp_inst not in NON_INSTRUCTORS:
                lis = re.sub(r'\s+', ' ', temp_inst).split(",")
                for i in range(0, len(lis), 2):
                    last_name = lis[i].strip()
                    other_names = lis[i+1].strip()
                    instructors.append(u"{0}, {1}".format(last_name, other_names))

            # Location
            location = values[x+3]

            # Class start/end times
            m = self.TIME_INFO.search(values[x+1])
            start_time = datetime.strptime(m.group(1), "%I:%M%p").time() if m else None
            m = self.TIME_INFO.search(values[x+2])
            end_time = datetime.strptime(m.group(1), "%I:%M%p").time() if m else None

            # Class start/end dates
            m = self.DATE_INFO.search(values[x+4])
            term_start = datetime.strptime(m.group(1), "%Y/%m/%d").date() if m else None
            term_end = datetime.strptime(m.group(2), "%Y/%m/%d").date() if m else None

            sections = []

            # Loop through all days
            all_days = values[x+0].lower()
            while len(all_days) > 0:
                day_abbr = all_days[-2:]
                all_days = all_days[:-2]

                # Get day of week
                if day_abbr in DAY_MAP:
                    day_of_week = DAY_MAP[day_abbr]
                else:
                    # A non-day was encountered (most likely 'TBA')
                    day_of_week = None
                    # Make sure only a single section is added
                    sections = []

                # Append the section to the list
                sections.append({
                    'day_of_week': day_of_week,
                    'start_time': start_time,
                    'end_time': end_time,
                    'location': location,
                    'instructors': instructors,
                    'term_start': term_start,
                    'term_end': term_end
                })

                # Stop adding if a non-day was encountered
                if day_of_week is None:
                    break

            ret.extend(sections)

        return ret

    def section_deep_attrs(self):
        """
        Parses out the section data from the section page. Used for deep scrapes.
        Information availible on the course page (such as class times) is not recorded.

        For best results, update the information from the course page with this information

        Return format:

        {
            'details':{
                'session': session,
                'location': course location,
                'campus': course campus
            },
            'availability':{
                'class_max': spaces in class,
                'class_curr': number enrolled,
                'wait_max': spaces on wait list,
                'wait_curr': number waiting
            }
        }
        """

        TABLE_CLASS = "PSGROUPBOXWBO"
        TABLE_HEADER_CLASS = "PAGROUPBOXLABELLEVEL1"
        EDITBOX_LABEL_CLASS = "PSEDITBOXLABEL"
        EDITBOX_DATA_CLASS = "PSEDITBOX_DISPONLY"

        DETAIL_LABEL = "Class Details"
        AVAILABILITY_LABEL = "Class Availability"

        ret = {
            'details': {},
            'availability': {}
        }

        # Iterate over all tables (only need 2)
        tables = self.soup.find_all("table", {"class": TABLE_CLASS})
        for table in tables:
            temp = table.find("td", {"class": TABLE_HEADER_CLASS})
            if not temp or not temp.string:
                # Nothing there
                continue

            elif temp.string == DETAIL_LABEL:
                labels = table.find_all("span", {"class": EDITBOX_LABEL_CLASS})
                data = table.find_all("span", {"class": EDITBOX_DATA_CLASS})
                num_components = len(data) - len(labels)

                # Store class attributes
                ret['details']['session'] = data[2].string
                ret['details']['location'] = data[8 + num_components].string
                ret['details']['campus'] = data[9 + num_components].string

            elif temp.string == AVAILABILITY_LABEL:
                data = table.find_all("span", {"class": EDITBOX_DATA_CLASS})

                # Store enrollment information
                ret['availability']['class_max'] = int(data[0].string)
                ret['availability']['wait_max'] = int(data[1].string)
                ret['availability']['class_curr'] = int(data[2].string)
                ret['availability']['wait_curr'] = int(data[3].string)

        return ret
