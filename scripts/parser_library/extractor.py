# @what     Parsing library Extractor (info)
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/22/16

import re, sys
import dateutil.parser as dparser
from scripts.parser_library.words import conjunctions_and_prepositions

class Extractor():

    def time_12to24(self,time12):
        ''' Attempts to convert 12hr time to 24hr time

        Args:
            time12 (str): 12 hour time format

        Returns:
            str: 24 hr time in format hrhr:minmin
        '''

        time24 = dparser.parse(time12)
        return time24.strftime('%H:%M')

        # match = re.match("(\d*):(\d*).*?(\S)", time12.strip())

        # # Transform to 24 hours
        # hours = int(match.group(1))
        # if re.search(r'[pP]', match.group(3)):
        #     hours = (hours%12)+12

        # # Return as 24hr-time string
        # return str(hours) + ":" + match.group(2)

    def extract_info(self, course, text):
        ''' Attempts to extract info from text and put it into course object.

        Args:
            course (dict): course object to place extracted information into
            text (str): text to attempt to extract information from

        Returns:
            * modifies course object
            str: the text trimmed of extracted information
        '''
        text = text.encode('utf-8', 'ignore')
        extractions = {
            'prereqs' : [
                r'[Pp]r(?:-?)e[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
                r'T[Aa][Kk][Ee] (.*)\.?$'
            ],
            'coreqs'  : [
                r'[Cc]o(?:-?)[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*'
            ],
            'geneds'  : [
                r'GE (.*)'
            ],
            'fees'    : [
                r'(?:Lab )?Fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)'
            ]
        }

        for key, extraction_list in extractions.items():
            for extraction in extraction_list:
                rex = re.compile(extraction)
                extracted = rex.search(text)
                if extracted:
                    if not course.get(key):
                        course[key] = []
                    if 'fees' == key and isinstance(course.get(key), float):
                        continue # NOTE: edge case if multiple fees present
                    course[key] += [extracted.group(1)] # okay b/c of course_cleanup
                    # FIXME -- this library does not enforce this, unsafe!
                if isinstance(text, str):
                    text = text.decode('utf-8')
                    text = unicodedata.normalize('NFKD', text)
                text = rex.sub('', text).strip()

        # Convert fees to float
        # NOTE: edge case, if mutliple fees have been extracted will take the first one only
        if course.get('fees') and isinstance(course['fees'], list):
            try:
                course['fees'] = float(course['fees'][0])
            except ValueError:
                course['fees'] = None

        # TEMPORARY: combine pre and co reqs
        requisites = []
        corequisites = []
        if hasattr(course.get('prereqs'), '__iter__'):
            try:
                for req in course['prereqs']:
                    req = req.strip()
                    if len(req) == 0:
                        continue
                    requisites += [req]
                    # requisites += 'Prerequisite: ' + ','.join(course.get('prereqs'))
            except UnicodeDecodeError:
                pass
        if hasattr(course.get('coreqs'), '__iter__'):
            try:
                for req in course['coreqs']:
                    req = req.strip()
                    if len(req) == 0:
                        continue
                    corequisites += [req]
                # requisites += ' Corequisite: ' + ','.join(course.get('coreqs'))
            except UnicodeDecodeError:
                pass

        if len(requisites) > 0:
            if 'prereqs' in course:
                course['prereqs'] += requisites
                course['prereqs'] = list(set(course['prereqs'])) # uniqueify
            if 'coreqs' in course:
                course['coreqs'] += corequisites
                course['coreqs'] = list(set(course['coreqs']))

        return text

    '''REGEX Analysis: (regex101.com)
        r'(?:Lab )?Fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)'
            Fee 30
            Fee $30
            Fees 3000.00
            Fees: $125
            Fees: $ 125.00
            Fees:  125
            Fee fdgdsad 123
            Lab Fee fdgdsad 123
            Fee: 30
            Fees: $400.
            Fees: $400.00
            Lab Fee 20
    '''

    @staticmethod
    def filter_term_and_year(years_and_terms, cmd_years=None, cmd_terms=None):
            if cmd_years is None and cmd_terms is None:
                return years_and_terms
            years = cmd_years if cmd_years is not None else years_and_terms
            for year in years:
                if year not in years_and_terms:
                    raise CourseParseError('year {} not defined'.format(year))
                terms = cmd_terms if cmd_terms is not None else years_and_terms[year]
                for term in terms:
                    if term not in years_and_terms[year]:
                        raise CourseParseError('term not defined for {} {}'.format(term, year))
            return {year: {term: years_and_terms[year][term] for term in terms} for year in years}

    @staticmethod
    def filter_departments(departments, cmd_departments=None):
        '''Filter department dictionary to only include those departments listed in cmd_departments, if given
        Args:
            department: dictionary of item <dept_code, dept_name>
        KwArgs:
            cmd_departments: department code list
        Return: filtered list of departments.
        '''

        # FIXME -- if groups exists, will only search current group
        if cmd_departments is None:
            return departments

        # department list specified as cmd line arg
        for cmd_dept_code in cmd_departments:
            if cmd_dept_code not in departments:
                raise CourseParseError('invalid department code {}'.format(cmd_dept_code))

        # Return dictionary of {code: name} or set {code}
        if isinstance(departments, dict):
            departments = {cmd_dept_code: departments[cmd_dept_code] for cmd_dept_code in cmd_departments}
        else:
            departments = {dept for dept in departments if dept in cmd_departments}

        return departments

    _ROMAN_NUMERAL = re.compile(r'^[iv]+$')

    @staticmethod
    def titlize(name):
        '''Title and keep roman numerals uppercase.'''
        name = name.lower()
        titled = ''
        for word in name.split():
            if Extractor._ROMAN_NUMERAL.match(word) is not None:
                titled += word.upper()
            else:
                titled += word.lower() if word in conjunctions_and_prepositions else word.title()
            titled += ' '
        return titled.strip()
