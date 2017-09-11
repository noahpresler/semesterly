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
import sys

from bs4 import NavigableString, Tag

from parsing.library.base_parser import BaseParser
from parsing.library.exceptions import ParseError
from parsing.library.utils import safe_cast, dict_filter_by_dict
from semesterly.settings import get_secret


class Parser(BaseParser):
    """George Washington University course parser.

    NOTE: GW cannot support multiple login!
    """

    URL = 'https://banweb.gwu.edu/PRODCartridge'
    YEARS_AND_TERMS = {
        2017: {
            'Fall': '201703',
            'Spring': '201701',
        },
        2016: {
            'Fall': '201603',
        }
    }

    def __new__(cls, *args, **kwargs):
        """Set static variables within closure.

        Returns:
            Parser
        """
        new_instance = object.__new__(cls)
        cls.CREDENTIALS = {
            'username': get_secret('GW_USER'),
            'password': get_secret('GW_PASS'),
            'security_question_answer': get_secret('GW_SECURITY_ANSWER')
        }
        return new_instance

    def __init__(self, **kwargs):
        """Construct GW parser object.

        Args:
            **kwargs: pass-through
        """
        super(Parser, self).__init__('gw', **kwargs)

    def start(self,
              years_and_terms_filter=None,
              departments_filter=None,
              verbosity=3,
              textbooks=None):
        """Start parse."""
        self._login()
        self._direct_to_search_page()

        years_and_terms = dict_filter_by_dict(
            Parser.YEARS_AND_TERMS,
            years_and_terms_filter
        )

        for year, terms in list(years_and_terms.items()):
            self.ingestor['year'] = year
            for term_name in terms:
                term_code = Parser.YEARS_AND_TERMS[year][term_name]
                self.ingestor['term'] = term_name

                # Retrieve term search page.
                soup = self.requester.get(
                    Parser.URL + '/bwckgens.p_proc_term_date',
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

                for dept_name, dept_code in depts.items():
                    self.ingestor['department'] = {
                        'name': dept_name,
                        'code': dept_code
                    }

                    query['sel_subj'] = ['dummy', dept_code]

                    rows = self.requester.post(
                        Parser.URL + '/bwskfcls.P_GetCrse',
                        params=query
                    )

                    Parser._check_errorpage(rows)

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
                                # 'ident': info[1].text,
                                'code': info[2].text + ' ' + info[3].text,
                                # 'href': info[1].find('a')['href'],
                                'dept': dept_name,
                                'section': info[4].text,
                                'credits': safe_cast(info[6].text, float,
                                                     default=0.),
                                'name': info[7].text,
                                'size': int(info[10].text),
                                'enrollment': int(info[11].text),
                                'waitlist': safe_cast(info[14].text, int,
                                                      default=-1),
                                'areas': '; '.join(info[22].text.split(' and ')) if len(info) == 23 else ''  # FIXME - hacky fix
                            })

                            # Query course catalog to obtain description.
                            catalog = self.requester.get(
                                Parser.URL + '/bwckctlg.p_display_courses',
                                params={
                                    'term_in': term_code,
                                    'one_subj': dept_code,
                                    'sel_crse_strt': info[3].text,
                                    'sel_crse_end': info[3].text,
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
                                    Parser._parse_catalogentrypage(catalog)
                                )

                            course = self.ingestor.ingest_course()

                            section_soup = self.requester.get(
                                Parser.URL + '/bwckschd.p_disp_listcrse',
                                params={
                                    'term_in': term_code,
                                    'subj_in': dept_code,
                                    'crse_in': info[3].text,
                                    'crn_in': info[1].text,
                                }
                            )

                            meetings_soup = Parser._extract_meetings(section_soup)
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

                            if len(meetings_soup) == 0:
                                continue
                            self.ingestor['section_type'] = meetings_soup[0].find_all('td')[5].text
                            section_model = self.ingestor.ingest_section(course)
                            self._parse_meetings(meetings_soup, section_model)

    def _login(self):
        # Collect necessary cookies
        self.requester.get(Parser.URL + '/twbkwbis.P_WWWLogin',
                           parse=False)

        self.requester.headers['Referer'] = '{}/twbkwbis.P_WWWLogin'.format(
            Parser.URL
        )

        logged_in = self.requester.post(
            Parser.URL + '/twbkwbis.P_ValLogin',
            parse=False,
            data={
                'sid': Parser.CREDENTIALS['username'],
                'PIN': Parser.CREDENTIALS['password']
            }
        )

        if logged_in.status_code != 200:
            print('Unexpected error: login unsuccessful',
                  sys.exc_info()[0],
                  file=sys.stderr)
            raise Exception('GW Parser, failed login')

        # Deal with security question page.
        self.requester.post(
            '{}/twbkwbis.P_ProcSecurityAnswer'.format(Parser.URL),
            parse=False,
            data={
                'RET_CODE': '',
                'SID': Parser.CREDENTIALS['username'],
                'QSTN_NUM': 1,
                'answer': Parser.CREDENTIALS['security_question_answer']
            }
        )

    def _direct_to_search_page(self):
        genurl = Parser.URL + '/twbkwbis.P_GenMenu'
        actions = ['bmenu.P_MainMnu', 'bmenu.P_StuMainMnu', 'bmenu.P_RegMnu']
        list(map(lambda n: self.requester.get(genurl, params={'name': n}), actions))
        self.requester.get(Parser.URL + '/bwskfcls.P_CrseSearch',
                           parse=False,
                           params={'term_in': ''})

    def _parse_meetings(self, meetings_soup, section_model):
        for meeting_soup in meetings_soup:
            col = meeting_soup.find_all('td')
            time = re.match(r'(.*) - (.*)', col[1].text)
            if not time:
                continue
            self.ingestor['time_start'] = time.group(1)
            self.ingestor['time_end'] = time.group(2)
            self.ingestor['days'] = [col[2].text]
            filtered_days = [x for x in self.ingestor['days'] if x.replace('\xa0', '')]
            if len(filtered_days) == 0:
                break
            self.ingestor['location'] = col[3].text
            self.ingestor.ingest_meeting(section_model)

    def _parse_instructors(self, meetings):
        self.ingestor['instrs'] = []
        for meeting in meetings:
            instructors = meeting.find_all('td')[6].text.split(',')

            # NOTE: must constrain instructor length LAW 6683
            for instructor in instructors[:5]:
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
        fields.update({'descr': Parser._extract_description(meat)})
        fields.update(Parser._extract_info(meat.find('td',
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
            'Levels': ('level', lambda s: 'Levels: ' + s.strip()),
            'Course Attributes': ('areas', lambda x: x.strip().split(','))
        }

        # Filter and map over (header, content) pairs.
        extracted = {}
        for name, data in list(fields.items()):
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
        raise ParseError('Error on page request, message: ' + error.text)
