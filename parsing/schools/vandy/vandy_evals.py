"""Filler."""

from __future__ import absolute_import, division, print_function

import re

from parsing.library.base_parser import BaseParser


class VandyEvalParser(BaseParser):
    """Vanderbilt Evaluation Parser.

    Attributes:
        BASE_URL (str): location of evals.
    """

    BASE_URL = 'https://www.sds.vanderbilt.edu/perl/voiceview.pl'
    CC_REGEX = re.compile(r'([A-Z&]{2,8}(?:-[A-Z]{2})?-\d{4}[A-Z]?)$')

    def __init__(self, **kwargs):
        """Construct Vandy Evaluation parser.

        Args:
            **kwargs: pass-through
        """
        super(VandyEvalParser, self).__init__('vandy', **kwargs)

    def _login(self):
        soup = self.requester.get(VandyEvalParser.BASE_URL)

        # Security checkpoint
        sec_block = soup.find('input',
                              attrs={'name': 'VSASM_ASVBlock'})['value']

        form = {
            'VSASM_ASVBlock': sec_block,
            'VSASM_user': 'khanaf',
            'VSASM_pw': 'Gainz!23',
            'VSASM_Login': 'Login'
        }

        # Accept Terms and Conditions page
        soup = self.requester.post(VandyEvalParser.BASE_URL, data=form)

        # Security checkpoint
        vsasm_block = soup.find('input',
                                attrs={'name': 'VSASM_BLOCK'})['value']

        form = {
            'VSASM_BLOCK': vsasm_block,
            'VoiceViewUserType': 'ActiveStudent',
            'TermsAccepted': 'OK'
        }

        # Search page
        soup = self.requester.post(VandyEvalParser.BASE_URL, data=form)

    def start(self, **kwargs):
        """Start parsing.

        Args:
            **kwargs: Nothing.
        """
        self._login()
        for school in self._parse_list_of_schools():
            for area in self._parse_list_of_areas(school):
                for course in self._parse_list_of_courses(school, area):
                    self._parse_eval_results(school, area, course)

    def _parse_eval_results(self, school, area, course):
        # Soupify post response
        soup = self.requester.post(VandyEvalParser.BASE_URL, data={
            'ViewSchool': school,
            'ViewArea': area,
            'ViewCourse': course
        })

        # Course review overview table
        overview_table = soup.find_all('table')

        # Make sure that table exists on page
        if len(overview_table) > 3:

            # Fun way to extract Score link
            for row in overview_table[3].find_all('tr'):

                cells = row.find_all('td')

                # Parse scores if available
                link = cells[len(cells) - 1].find('a')

                if not link:
                    continue

                # Parse single evaluations score page
                url = link['href'].replace('&amp;', '&')
                self._parse_eval_score_page(url)

    def _parse_eval_score_page(self, url):
        body = self.requester.get(url).find('table').find('body')
        title = body.find('title').text

        code, prof, sem = self._extract_info_from_title(title)

        # reformat semester and course code
        rsem = re.match(r'([a-zA-Z]*)(\d*)', sem)
        term = {
            'FALL': 'Fall',
            'SPR': 'Spring',
            'SUM': 'Summer'
        }[rsem.group(1)]
        year = rsem.group(2)

        rcode = re.match(r'([a-zA-Z]*)(\d*)', code)
        code = rcode.group(1) + '-' + rcode.group(2)

        # List of all questions in review
        questions = body.find('table').find('table').find_all('td',
                                                              valign='top',
                                                              width='200')

        all_questions = ''

        total_votes = 0
        total_score = 0

        for question in questions:

            # extract table of results for question
            table = question.find_next('table')

            # Adjectives to describe scores
            adjs = table.find_all('td', {
                'align': 'right',
                'nowrap': '',
                'rowspan': '20',
                'valign': 'center',
                'width': '250'
            })

            all_questions += 'Q: ' + question.text.strip() + '\n'

            # Iterate over adjectives
            for adj, i in zip(adjs, range(len(adjs))):

                # Label (adjective) to describe numeric score
                label = adj.contents[0].strip()

                # Number of votes for label
                votes = adj.find_next('td', {
                    'align': 'right',
                    'rowspan': '20',
                    'style': 'font-size:75%',
                    'valign': 'center',
                    'width': '24'
                }).text.strip()

                question_text = 'Give an overall rating of the course'
                if (label != 'No response' and
                        question.text.strip() == question_text):
                    total_votes += int(votes)
                    total_score += int(votes) * (i + 1)

                all_questions += label + ':' + votes + '\n'

            all_questions += '\n'

        try:
            score = round(float(total_score) / total_votes, 1)
        except ZeroDivisionError:
            score = 0

        self._create_review_item(code, prof, score, all_questions, year, term)

    def _extract_info_from_title(self, title):
        match = re.match("Course Evaluation for (.*)-.* (.*, .*) (.*)", title)
        return match.group(1), match.group(2), match.group(3)

    def _parse_list_of_courses(self, school, area):
        soup = self.requester.post(VandyEvalParser.BASE_URL, data={
            'ViewSchool': school,
            'ViewArea': area
        })
        courses = soup.find('select',
                            attrs={'name': 'ViewCourse'}).find_all('option')
        return [c['value'].strip() for c in courses if c['value'].strip()]

    def _parse_list_of_areas(self, school):
        soup = self.requester.post(VandyEvalParser.BASE_URL,
                                   data={'ViewSchool': school})
        areas = soup.find('select',
                          attrs={'name': 'ViewArea'}).find_all('option')
        return [a['value'] for a in areas if a['value']]

    def _parse_list_of_schools(self):
        soup = self.requester.get(VandyEvalParser.BASE_URL)
        schools = soup.find('select',
                            attrs={'name': 'ViewSchool'}).find_all('option')
        return [s['value'] for s in schools if s['value']]

    def _create_review_item(self, code, prof, score, summary, year, term):
        self.ingestor['year'] = year
        self.ingestor['term'] = term
        self.ingestor['course_code'] = code
        self.ingestor['score'] = score
        self.ingestor['summary'] = summary
        self.ingestor['instr'] = {
            'name': {
                'first': prof.split(',')[1],
                'last': prof.split(',')[0]
            }
        }

        # TODO - review why non-matching cc codes are present in evals
        if VandyEvalParser.CC_REGEX.match(code) is None:
            return
        self.ingestor.ingest_eval()
