# @what     Parsing library Extractor (info)
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/22/16

import re, sys
import dateutil.parser as dparser

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
            'coreqs'  : [r'[Cc]o(?:-?)[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*'],
            'geneds'  : [r'GE (.*)'],
            'fees'    : [r'(?:Lab )?Fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)']
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
                text = rex.sub('', text).strip()

        # Convert fees to float
        # NOTE: edge case, if mutliple fees have been extracted will take the first one
        if course.get('fees') and isinstance(course['fees'], list):
            try:
                course['fees'] = float(course['fees'][0])
            except ValueError:
                course['fees'] = None
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