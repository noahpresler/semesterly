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

from abc import ABCMeta

from parsing.common.textbooks.amazon_textbooks import amazon_textbook_fields
from parsing.library.base_parser import BaseParser
from parsing.library.exceptions import ParseError
from parsing.library.utils import dict_filter_by_dict, dict_filter_by_list


class PeoplesoftParser(BaseParser, metaclass=ABCMeta):
    """Generalized Peoplesoft course parser."""

    DAY_MAP = {
        'Mo': 'M',
        'Tu': 'T',
        'We': 'W',
        'Th': 'R',
        'Fr': 'F',
        'Sa': 'S',
        'Su': 'U'
    }

    AJAX_PARAMS = {
        'ICAJAX': '1',
        'ICNAVTYPEDROPDOWN': '0'
    }

    IC_ACTIONS = {
        'adv_search': 'DERIVED_CLSRCH_SSR_EXPAND_COLLAPS$149$$1',
        'save': '#ICSave',
        'term': 'CLASS_SRCH_WRK2_STRM$35$',
        'class_search': 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH',
    }

    def __init__(self, school, url,
                 url_params=None,
                 department_name_regex=re.compile(r'(.*)'),
                 **kwargs):
        """Construct Peoplesoft parsing object."""
        self.base_url = url
        self.url_params = url_params or {}
        self.department_name_regex = department_name_regex
        super(PeoplesoftParser, self).__init__(school, **kwargs)

    def start(self, **kwargs):
        """Start parsing courses."""
        self.parse(**kwargs)

    def parse(self,
              verbosity=3,
              textbooks=True,
              years_and_terms_filter=None,
              departments_filter=None,
              department_name_regex=None):
        """Do parse."""
        self.verbosity = verbosity
        self.textbooks = textbooks
        self._empty_ingestor_lists()

        # NOTE: umich will do nothing and return an empty dict
        soup, params = self._goto_search_page(self.url_params)
        years_and_terms = dict_filter_by_dict(
            self._get_years_and_terms(soup),
            years_and_terms_filter
        )
        for year, terms in years_and_terms.items():
            self.ingestor['year'] = year
            for term_name, term_code in terms.items():
                soup = self._term_update(term_code, params)
                self.ingestor['term'] = term_name

                # NOTE: schools that do not use groups will return {None: None}
                groups = self._get_groups(soup, params)
                for group_id, group_name in list(groups.items()):
                    params2 = {}
                    if group_id is not None:
                        soup = self._group_update(group_id, params)
                        params2 = PeoplesoftParser._hidden_params(soup,
                                                                  ajax=True)
                    else:  # School does not use groups.
                        # Update search params to get course list.
                        params = PeoplesoftParser._exclude_ajax_params(params)
                        params.update(
                            PeoplesoftParser._create_ic_action('class_search')
                        )
                        params2 = params

                    # extract department list info
                    dept_param_key = self._get_dept_param_key(soup)
                    departments, department_ids = self._get_departments(
                        soup,
                        departments_filter
                    )

                    for dept_code, dept_name in departments.items():
                        self.ingestor['dept_name'] = dept_name
                        self.ingestor['dept_code'] = dept_code

                        # Update search payload with department code
                        params2[dept_param_key] = dept_code
                        if department_ids is not None:
                            params2[dept_param_key] = department_ids[dept_code]

                        # Get course listing page for department
                        soup = self.requester.post(self.base_url,
                                                   params=params2)
                        if not self._is_valid_search_page(soup):
                            continue
                        if self._is_special_search(soup):  # too many results
                            soup = self._handle_special_case_on_search(soup)

                        courses = self._get_courses(soup)
                        course_soups = self._get_course_list_as_soup(courses,
                                                                     soup)
                        for course_soup in course_soups:
                            self._parse_course_description(course_soup)

    @staticmethod
    def _find_all_isbns(soup):
        return list(zip(
            soup.find_all(
                'span',
                id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')
            ),
            soup.find_all(
                'span',
                id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*')
            )
        ))

    def _get_years_and_terms(self, soup):
        term_datas = soup.find(
            'select',
            id='CLASS_SRCH_WRK2_STRM$35$'
        ).find_all('option')
        years_terms_values = {}
        for term_data in term_datas[1:]:
            # differentiate between term name and years
            year_or_term1, year_or_term2 = term_data.text.split(' ', 1)
            try:
                year = str(int(year_or_term1))
                term = year_or_term2
            except ValueError:
                year = str(int(year_or_term2))
                term = year_or_term1

            if year not in years_terms_values:
                years_terms_values[year] = {}
            years_terms_values[year][term] = term_data['value']
        return years_terms_values

    def _get_courses(self, soup):
        return soup.find_all('table', class_='PSLEVEL1GRIDNBONBO')

    def _goto_search_page(self, url_params):
        """Direct session to search page."""
        soup = self.requester.get(self.base_url, params=self.url_params)

        # Create search payload for adv search.
        params = PeoplesoftParser._hidden_params(soup)
        params.update(PeoplesoftParser._create_ic_action('adv_search'))
        soup = self.requester.post(self.base_url, params=params)

        refined_search_query = {
            'SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$4': 'N',
            'SSR_CLSRCH_WRK_SSR_OPEN_ONLY$chk$5': 'N',
            'SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$5': 'J',
            'SSR_CLSRCH_WRK_INCLUDE_CLASS_DAYS$6': 'J'
        }
        for day in ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN']:
            refined_search_query.update({
                'SSR_CLSRCH_WRK_{}$5'.format(day): 'Y',
                'SSR_CLSRCH_WRK_{}$chk$5'.format(day): 'Y',
                'SSR_CLSRCH_WRK_{}$6'.format(day): 'Y',
                'SSR_CLSRCH_WRK_{}$chk$6'.format(day): 'Y',
            })

        params.update(refined_search_query)
        return soup, params

    def _get_groups(self, soup, params):
        return {None: None}  # No groups

    def _group_update(self, group_id, params):
        return  # Do nothing.

    def _term_update(self, term_code, params):
        """Update search page with term as parameter."""
        params[PeoplesoftParser.IC_ACTIONS['term']] = term_code
        params.update(PeoplesoftParser._create_ic_action('term'))
        params.update(PeoplesoftParser.AJAX_PARAMS)
        return self.requester.post(self.base_url, params=params)

    @staticmethod
    def _exclude_ajax_params(params):
        """Filter out params related to ajax."""
        return {
            k: v for k, v in list(params.items())
            if k not in list(PeoplesoftParser.AJAX_PARAMS.keys())
        }

    def _get_dept_param_key(self, soup):
        return soup.find(
            'select',
            id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d')
        )['id']

    def _get_departments(self, soup, departments_filter=None):
        dept_soups = soup.find(
            'select',
            id=re.compile(r'SSR_CLSRCH_WRK_SUBJECT_SRCH\$\d')
        ).find_all('option')[1:]

        def extract_dept_name(d):
            return self.department_name_regex.match(d).group(1)
        departments = {
            d['value']: extract_dept_name(d.text) for d in dept_soups
        }
        return dict_filter_by_list(departments, departments_filter), None

    def _get_course_list_as_soup(self, courses, soup):
        """Fill payload for course description page request."""
        payload = PeoplesoftParser._hidden_params(soup)
        for i in range(len(courses)):
            payload.update({'ICAction': 'MTG_CLASS_NBR$' + str(i)})
            soup = self.requester.get(self.base_url, params=payload)
            yield soup

    def _parse_course_description(self, soup):
        # scrape info from page
        title = soup.find(
            'span',
            id='DERIVED_CLSRCH_DESCR200'
        ).text

        subtitle = soup.find(
            'span',
            id='DERIVED_CLSRCH_SSS_PAGE_KEYDESCR'
        ).text

        units = soup.find('span', id='SSR_CLS_DTL_WRK_UNITS_RANGE').text
        capacity = soup.find('span', id='SSR_CLS_DTL_WRK_ENRL_CAP').text
        enrollment = soup.find('span', id='SSR_CLS_DTL_WRK_ENRL_TOT').text
        # waitlist = soup.find('span', id='SSR_CLS_DTL_WRK_WAIT_TOT').text
        descr = soup.find('span', id='DERIVED_CLSRCH_DESCRLONG')
        notes = soup.find('span', id='DERIVED_CLSRCH_SSR_CLASSNOTE_LONG')
        req = soup.find('span', id='SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG')
        areas = soup.find('span', id='SSR_CLS_DTL_WRK_SSR_CRSE_ATTR_LONG')
        components = soup.find(
            'div',
            id=re.compile(r'win\ddivSSR_CLS_DTL_WRK_SSR_COMPONENT_LONG')
        )

        # parse table of times
        scheds = soup.find_all('span', id=re.compile(r'MTG_SCHED\$\d*'))
        locs = soup.find_all('span', id=re.compile(r'MTG_LOC\$\d*'))
        instrs = soup.find_all('span', id=re.compile(r'MTG_INSTR\$\d*'))
        dates = soup.find_all('span', id=re.compile(r'MTG_DATE\$\d*'))

        # parse textbooks
        self._parse_textbooks(soup)

        rtitle = re.match(r'(.+?\s*\w+) - (\w+)\s*(\S.+)', title)
        self.ingestor['section_type'] = subtitle.split('|')[2].strip()

        # Place course info into course model
        self.ingestor['course_code'] = re.sub(r'\s+', ' ', rtitle.group(1))
        self.ingestor['course_name'] = rtitle.group(3)
        self.ingestor['section_code'] = rtitle.group(2)
        self.ingestor['credits'] = float(re.match(r'(\d*).*', units).group(1))
        self.ingestor['prereqs'] = [x.text for x in [_f for _f in [req] if _f]]
        self.ingestor['descr'] = '\n'.join(
            [x.text for x in [_f for _f in [descr, notes, areas] if _f]]
        )
        self.ingestor['size'] = int(capacity)
        self.ingestor['enrollment'] = int(enrollment)
        instructors = []
        for instr in instrs:
            instructors += instr.text.split(', \r')
        # NOTE: truncate instructor list to 5 instructors for db
        if len(instructors) > 5:
            instructors = instructors[:5]
            instructors.append('..., ...')
        self.ingestor['instrs'] = list(set(instructors))

        # TODO - integrate this nicer
        # Handle condition such that a laboratory (or another type) of section
        #  with 0 units does not overwrite a main lecture section
        create_course = True
        if components is not None:
            components = components.text.strip()
            components = {
                component.replace('Required', '').strip()
                for component in components.split(',')
            }
            if (len(components) > 1 and
                    self.ingestor['credits'] == 0 and
                    'Lecture' in components and
                    'Lecture' != self.ingestor['section_type'] and
                    self.ingestor['course_code'] in self.ingestor.validator.seen):
                create_course = False
                course = {'code': self.ingestor['course_code']}

        if create_course:
            course = self.ingestor.ingest_course()
        section = self.ingestor.ingest_section(course)

        # Parse offering details.
        for sched, loc, date in zip(scheds, locs, dates):

            rsched = re.match(r'([a-zA-Z]*) (.*) - (.*)', sched.text)

            if rsched:
                days = [PeoplesoftParser.DAY_MAP[d] for d in re.findall(r'[A-Z][^A-Z]*', rsched.group(1))]
                time = (
                    rsched.group(2),
                    rsched.group(3)
                )
            else:  # handle TBA classes
                continue

            self.ingestor['time_start'] = time[0]
            self.ingestor['time_end'] = time[1]
            re.match(r'(.*) (\d+)', loc.text)
            self.ingestor['location'] = loc.text
            self.ingestor['days'] = days

            self.ingestor.ingest_meeting(section)

        self._empty_ingestor_lists()

    def _parse_textbooks(self, soup):
        # BUG: gaurantee with regex match order and textbook status...?
        textbooks = list(zip(
            soup.find_all(
                'span',
                id=re.compile(r'DERIVED_SSR_TXB_SSR_TXBDTL_ISBN\$\d*')
            ),
            soup.find_all(
                'span',
                id=re.compile(r'DERIVED_SSR_TXB_SSR_TXB_STATDESCR\$\d*'))
        ))

        # Remove extra characters from isbn and tranform Required into boolean.
        for i in range(len(textbooks)):
            textbooks[i] = {
                'isbn': [x for x in textbooks[i][0].text if x.isdigit()],
                'required': textbooks[i][1].text[0].upper() == 'R',
            }

        # Create textbooks.
        if self.textbooks:
            for textbook in textbooks:
                if (not textbook['isbn'] or
                        (len(textbook['isbn']) != 10 and
                            len(textbook['isbn']) != 13)):
                    continue  # NOTE: might skip some malformed-isbn values
                amazon_fields = amazon_textbook_fields(textbook['isbn'])
                if amazon_fields is not None:
                    textbook.update(amazon_fields)
                else:  # Make sure to clear ingestor from prev (temp fix)
                    textbook.update({
                        'detail_url': None,
                        'image_url': None,
                        'author': None,
                        'title': None,
                    })
                self.ingestor.update(textbook)
                self.ingestor.ingest_textbook()
                self.ingestor.setdefault('textbooks', []).append({
                    'kind': 'textbook_link',
                    'isbn': textbook['isbn'],
                    'required': textbook['required'],
                })

    def _empty_ingestor_lists(self):
        """
        Hard set optional ingestor fields.

        For each iteration of the parsing the ingestor is updated by writing
        over entries in the ingestor dictionary. Some fields, however,
        are not seen every iteration and must be hard reset to their initial
        state to avoid data overlapping. In addition, it leads to cleaner code
        when assuming the invariant that all these lists exists as you can
        just append to them rather than checking and creating the list every
        time.
        """
        self.ingestor['prereqs'] = []
        self.ingestor['coreqs'] = []
        self.ingestor['geneds'] = []
        self.ingestor['fees'] = []
        self.ingestor['textbooks'] = []

    @staticmethod
    def _hidden_params(soup, params=None, ajax=False):
        """
        Extract hidden parameters on page.

        Kwargs:
            params: if passed a dictionary will mutate said dictionary,
                    else will create a new dictionary.
        """
        if params is None:
            params = {}

        def find(tag):
            return soup.find(tag, id=re.compile(r'win\ddivPSHIDDENFIELDS'))
        hidden = find('div')
        if not hidden:
            hidden = find('field')

        params.update({
            a['name']: a['value'] for a in hidden.find_all('input')
        })

        if ajax:
            params.update(PeoplesoftParser.AJAX_PARAMS)

        return params

    def _is_valid_search_page(self, soup):
        # check for valid search/page
        if soup is None:
            # TODO - write to error.log with set handle
            raise ParseError('is valid search page, soup is None')
        errmsg = soup.find('div', id='win1divDERIVED_CLSMSG_ERROR_TEXT')
        if soup.find('td', id='PTBADPAGE_') or errmsg:
            if errmsg:
                if self.verbosity >= 3:
                    sys.stderr.write('Error on search: {}'.format(errmsg.text))
            return False
        return True

    def _is_special_search(self, soup):
        return (
            soup.find('span', class_='SSSMSGINFOTEXT') or
            soup.find('span', id='DERIVED_SSE_DSP_SSR_MSG_TEXT')
        )

    @staticmethod
    def _create_ic_action(act):
        return {'ICAction': PeoplesoftParser.IC_ACTIONS[act]}

    def _handle_special_case_on_search(self, soup):
        if self.verbosity >= 3:
            print(
                'SPECIAL SEARCH MESSAGE: {}'.format(
                    soup.find('span', class_='SSSMSGINFOTEXT').text
                ),
                file=sys.stderr
            )

        query = PeoplesoftParser._hidden_params(soup, ajax=True)
        query['ICAction'] = '#ICSave'

        return self.requester.post(self.base_url, params=query)


class UPeoplesoftParser(PeoplesoftParser):
    """Modifies Peoplesoft parser to accomodate different structure (umich)."""

    def __init__(self, school, url, term_base_url=None, years_and_terms=None, **kwargs):
        """Construct Umich parsing object."""
        # Each term has its own page that must be requested from base url.
        self.term_base_url = term_base_url
        self.years_and_terms_static = years_and_terms
        super(UPeoplesoftParser, self).__init__(school, url, **kwargs)

    def _get_years_and_terms(self, soup):
        return self.years_and_terms_static

    def _get_departments(self, soup, departments_filter=None):
        # extract department query list
        departments = soup.find_all(
            'a',
            id=re.compile(r'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH\$\d')
        )
        department_names = soup.find_all(
            'span',
            id=re.compile(r'M_SR_SS_SUBJECT_DESCR\$\d')
        )
        depts = {
            dept.text: dept_name.text
            for dept, dept_name in zip(departments, department_names)
        }
        dept_ids = {dept.text: dept['id'] for dept in departments}
        return dict_filter_by_list(
            depts,
            departments_filter,
        ), dept_ids

    def _get_dept_param_key(self, soup):
        return 'ICAction'

    def _term_update(self, term_code, params):
        if self.term_base_url is None:
            self.term_base_url = self.base_url
        return self.requester.get(self.term_base_url, {'strm': term_code})

    def _get_groups(self, soup, params):
        params.update(PeoplesoftParser._hidden_params(soup, ajax=True))
        groups = soup.find_all('a', id=re.compile(r'M_SR_DERIVED2_GROUP1\$\d'))
        return {group['id']: group.text for group in groups}

    def _group_update(self, group_id, params):
        params['ICAction'] = group_id
        soup = self.requester.post(self.base_url, data=params)
        return soup

    def _goto_search_page(self, url_params):
        # Do nothing, there is no search page in this control flow.
        return None, {}

    def _get_courses(self, soup):
        return soup.find_all('table', class_='PSLEVEL1GRIDROWNBO')
