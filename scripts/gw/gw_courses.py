"""
GW Course Parser.

@org    Semeseter.ly
@author Michael N. Miller
@date   11/26/16
"""

from __future__ import absolute_import, division, print_function

import re
import sys

from bs4 import NavigableString, Tag

from scripts.parser_library.base_parser import CourseParser
from scripts.parser_library.internal_exceptions import CourseParseError
from scripts.parser_library.internal_utils import safe_cast


class GWParser(CourseParser):
    """George Washington University course parser object.

    NOTE: GW cannot support multiple login!
    """

    SCHOOL = 'gw'
    URL = 'https://banweb.gwu.edu/PRODCartridge'
    CREDENTIALS = {
        ***REMOVED***,
        '***REMOVED***,
        ***REMOVED***
    }

    def __init__(self, **kwargs):
        """Construct GW parser."""
        self.terms = {
            'Fall 2017': '201703',
            'Fall 2016': '201603',
            'Spring 2017': '201701'
        }

        super(GWParser, self).__init__(GWParser.SCHOOL, **kwargs)

    def start(self, **kwargs):
        """Start parse."""
        self._login()
        self._direct_to_search_page()

        for term_name, term_code in self.terms.items():
            self.ingestor['term'], self.ingestor['year'] = term_name.split()

            # Retrieve term search page.
            soup = self.requester.get(
                GWParser.URL + '/bwckgens.p_proc_term_date',
                params={
                    'p_calling_proc': 'P_CrseSearch',
                    'p_term': term_code
                }
            )

            # Create search param list.
            input_options_soup = soup.find(
                'form',
                action='/PRODCartridge/bwskfcls.P_GetCrse'
            ).find_all('input')

            query = {}
            for input_option in input_options_soup:
                query[input_option['name']] = input_option.get('value', '')
            query.update({
                'begin_hh': '0',
                'begin_mi': '0',
                'end_hh': '0',
                'end_mi': '0',
                'sel_ptrm': '%',
                'SUB_BTN': 'Section Search'
            })

            # Construct list of departments.
            depts = {}
            depts_soup = soup.find('select', id='subj_id').find_all('option')
            for dept_soup in depts_soup:
                depts[dept_soup.text.strip()] = dept_soup['value']

            for dept_name, dept_code in depts.iteritems():
                self.ingestor['department'] = {
                    'name': dept_name,
                    'code': dept_code
                }

                query['sel_subj'] = ['dummy', dept_code]

                rows = self.requester.post(
                    GWParser.URL + '/bwskfcls.P_GetCrse',
                    params=query)

                GWParser._check_errorpage(rows)

                try:
                    rows = rows.find(
                        'table',
                        class_='datadisplaytable'
                    ).find_all('tr')[2:]
                except AttributeError:
                    print('message: no results for department',
                          dept_name,
                          file=sys.stderr)
                    continue  # no results for department

                # collect offered courses in department
                for row in rows:
                    info = row.find_all('td')
                    if info[1].find('a'):

                        # general info
                        self.ingestor.update({
                            'ident': info[1].text,
                            'code': info[2].text + ' ' + info[3].text,
                            'href': info[1].find('a')['href'],
                            'dept': dept_name,
                            'selec': info[3].text,
                            'section': info[4].text,
                            'credits': safe_cast(info[6].text, float,
                                                 default=0.),
                            'name': info[7].text,
                            'size': int(info[10].text),
                            'enrollment': int(info[11].text),
                            'waitlist': safe_cast(info[14].text, int,
                                                  default=-1),
                            'attr': '; '.join(info[22].text.split(' and ')) if len(info) == 23 else ''  # FIXME - hacky fix
                        })

                        # Query course catalog to obtain description.
                        catalog = self.requester.get(
                            GWParser.URL + '/bwckctlg.p_display_courses',
                            params={
                                'term_in': term_code,
                                'one_subj': dept_code,
                                'sel_crse_strt': self.ingestor['selec'],
                                'sel_crse_end': self.ingestor['selec'],
                                'sel_subj': '',
                                'sel_levl': '',
                                'sel_schd': '',
                                'sel_coll': '',
                                'sel_divs': '',
                                'sel_dept': '',
                                'sel_attr': ''
                            }
                        )

                        if catalog:
                            self.ingestor.update(
                                GWParser._parse_catalogentrypage(catalog)
                            )

                        course = self.ingestor.ingest_course()

                        section_soup = self.requester.get(
                            GWParser.URL + '/bwckschd.p_disp_listcrse',
                            params={
                                'term_in': term_code,
                                'subj_in': dept_code,
                                'crse_in': self.ingestor['selec'],
                                'crn_in': self.ingestor['ident']
                            })

                        meetings_soup = GWParser._extract_meetings(section_soup)
                        """Example of a meeting entry
                        <tr>
                            <td class="dddefault">Class</td>
                            <td class="dddefault">4:00 pm - 6:00 pm</td>
                            <td class="dddefault">T</td>
                            <td class="dddefault">See Department DEPT</td>
                            <td class="dddefault">08/28/17 - 12/11/17</td>
                            <td class="dddefault">Lecture</td>
                            <td class="dddefault">Timothy A.  McCaffrey (<abbr title="Primary">P</abbr>), David   Leitenberg </td>
                        </tr>
                        """

                        self._parse_instructors(meetings_soup)

                        if len(meetings_soup) > 0:
                            self.ingestor['section_type'] = meetings_soup[0].find_all('td')[5].text
                            section_model = self.ingestor.ingest_section(course)

                        self._parse_meetings(meetings_soup, section_model)

    def _login(self):
        # Collect necessary cookies
        self.requester.get(GWParser.URL + '/twbkwbis.P_WWWLogin',
                           parse=False)

        self.requester.headers['Referer'] = '{}/twbkwbis.P_WWWLogin'.format(
            GWParser.URL
        )

        logged_in = self.requester.post(
            GWParser.URL + '/twbkwbis.P_ValLogin',
            parse=False,
            data={
                'sid': GWParser.CREDENTIALS['USERNAME'],
                'PIN': GWParser.CREDENTIALS['PASSWORD']
            }
        )

        if logged_in.status_code != 200:
            print('Unexpected error: login unsuccessful',
                  sys.exc_info()[0],
                  file=sys.stderr)
            raise Exception('GW Parser, failed login')

        # Deal with security question page.
        self.requester.post(
            '{}/twbkwbis.P_ProcSecurityAnswer'.format(GWParser.URL),
            parse=False,
            data={
                'RET_CODE': '',
                'SID': GWParser.CREDENTIALS['USERNAME'],
                'QSTN_NUM': 1,
                'answer': GWParser.CREDENTIALS['SECURITY_QUESTION_ANSWER']
            }
        )

    def _direct_to_search_page(self):
        genurl = GWParser.URL + '/twbkwbis.P_GenMenu'
        actions = ['bmenu.P_MainMnu', 'bmenu.P_StuMainMnu', 'bmenu.P_RegMnu']
        map(lambda n: self.requester.get(genurl, params={'name': n}), actions)
        self.requester.get(GWParser.URL + '/bwskfcls.P_CrseSearch',
                           parse=False,
                           params={'term_in': ''})

    def _parse_meetings(self, meetings_soup, section_model):
        for meeting_soup in meetings_soup:
            col = meeting_soup.find_all('td')
            time = re.match(r'(.*) - (.*)', col[1].text)
            if not time:
                continue
            self.ingestor['time_start'] = self.extractor.time_12to24(time.group(1))
            self.ingestor['time_end'] = self.extractor.time_12to24(time.group(2))
            self.ingestor['days'] = [col[2].text]
            filtered_days = filter(lambda x: x.replace(u'\xa0', u''),
                                   self.ingestor['days'])
            if len(filtered_days) == 0:
                break
            self.ingestor['location'] = col[3].text
            self.ingestor.ingest_meeting(section_model)

    def _parse_instructors(self, meetings):
        self.ingestor['instrs'] = []
        for meeting in meetings:
            instructors = meeting.find_all('td')[6].text.split(',')

            # NOTE: must constrain instructor length LAW 6683
            for instructor in instructors[:20]:
                # Remove extra internal spaces.
                instructor = ' '.join(instructor.split())

                # Remove primary tag from instructor name.
                instructor = re.match(
                    r'(.*?)(?: \(P\))?$',
                    instructor
                ).group(1)

                self.ingestor['instrs'].append(instructor)

    @staticmethod
    def _parse_catalogentrypage(soup):
        fields = {}
        meat = soup.find('body').find('table', class_='datadisplaytable')
        if meat is None:
            return {}
        fields.update({'descr': GWParser._extract_description(meat)})
        fields.update(GWParser._extract_info(meat.find('td',
                                                       class_='ntdefault')))
        return fields

    @staticmethod
    def _extract_description(soup):
        try:
            meat = soup.find_all('tr', recursive=False)[1].find('td')
            descr = re.match(r'<td .*?>\n([^<]+)<[^$]*</td>', meat.prettify())
            return ' '.join(descr.group(1).strip().splitlines())
        except:
            return ''

    @staticmethod
    def _extract_info(soup):
        # Link field in <span> tag to text proceeding it.
        fields = {}
        for t in soup.find_all('span', class_='fieldlabeltext'):
            data = t.next_sibling

            # Skip newline tags.
            while data and isinstance(data, Tag) and data.name == 'br':
                data = data.next_sibling

            if not isinstance(data, NavigableString):
                data = data.text
            fields[t.text.strip()[:-1]] = data

        extraction = {
            'Schedule Types': ('section_type', lambda s: s[0].upper()),
            'Levels': ('info', lambda s: 'Levels: ' + s.strip()),
            'Course Attributes': ('areas', lambda x: x.strip().split(','))
        }

        # Filter and map over (header, content) pairs.
        extracted = {}
        for name, data in fields.items():
            if extraction.get(name):
                extracted[extraction[name][0]] = extraction[name][1](data)

        return extracted

    @staticmethod
    def _extract_meetings(soup):
        meetings = soup.find('table', class_='datadisplaytable')
        if meetings:
            meetings = meetings.find('table', class_='datadisplaytable')
            if meetings:
                meetings = meetings.find_all('tr')[1:]
        if meetings:
            return meetings
        else:
            return []

    @staticmethod
    def _check_errorpage(soup):
        error = soup.find('span', class_='errortext')
        if not error:
            return
        raise CourseParseError('Error on page request, message: ' + error.text)
