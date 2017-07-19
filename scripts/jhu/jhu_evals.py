"""JHU Evaluation Parser."""

from __future__ import absolute_import, division, print_function

import os
import re
import sys

import urllib

from bs4 import BeautifulSoup

from scripts.parser_library.base_parser import BaseParser


class HopkinsEvalParser(BaseParser):

    CODE_PATTERN = re.compile(r'^[A-Z]{2}\.\d{3}\.\d{3}\..*$')
    SCORE_PATTERN = re.compile(r'.*(\d\.\d\d).*')
    SUMMARY_PATTERN = re.compile(r'Summary:.*|This class had 5 or fewer comments\.')
    THRESH_PATTERN = re.compile(r'This class had 5 or fewer comments\.')
    CODE_CAP_PATTERN = re.compile(r'^.*\.(.*\..*)\..*$')

    def __init__(self, **kwargs):
        """Create Hopkins eval parser instance.

        Args:
            **kwargs: pass-through
        """
        super(HopkinsEvalParser, self).__init__('jhu', **kwargs)

    def start(self, **kwargs):
        directory = '{}/scripts/jhu/HopkinsEvaluations'.format(os.getcwd())
        for fn in os.listdir('./scripts/jhu/HopkinsEvaluations'):
            term, year = os.path.splitext(fn)[0].split(':')
            eval_file_path = '{}/{}'.format(directory, fn)
            soup = BeautifulSoup(urllib.urlopen(eval_file_path).read(),
                                 'html.parser')
            self._process_soup(soup, term, year)

    def _process_soup(self, soup, term, year):
        course_codes = list(set(soup.find_all('b', text=HopkinsEvalParser.CODE_PATTERN)))
        for cc in course_codes:
            code = cc.contents[0]
            title = cc.find_next('b').contents[0]
            profs = title.find_next('b').contents[0]
            score = self._get_score(profs.find_next(text=HopkinsEvalParser.SCORE_PATTERN))
            summary = self._get_summary(title.find_next('p', text=HopkinsEvalParser.SUMMARY_PATTERN))
            self._make_review_item(code, profs.split(','), score, summary, term, year)

    def _get_summary(self, summary_header):
        if re.match(HopkinsEvalParser.THRESH_PATTERN, summary_header.text):
            return summary_header.text
        summary = []
        curr_tag = summary_header.find_next()
        while curr_tag is not None:
            if curr_tag.name == "p":
                if curr_tag.text.find("write-in") != -1:
                    break
                elif ('left:450px;' not in curr_tag['style'] and
                        len(curr_tag.find_all()) == 0):
                    summary.append(curr_tag.text)
                elif ("left:108px" in curr_tag['style'] and
                        re.match(HopkinsEvalParser.CODE_PATTERN, curr_tag.text)):
                    break
            curr_tag = curr_tag.find_next()
        return ''.join(summary)

    def _get_score(self, raw):
        match = re.search(HopkinsEvalParser.SCORE_PATTERN, raw)
        return match.group(1)

    def _make_review_item(self, code, profs, score, summary, term, year):
        self.ingestor['year'] = year
        self.ingestor['term'] = term
        self.ingestor['summary'] = summary
        self.ingestor['score'] = min(5, float(score))
        self.ingestor['instrs'] = profs
        self.ingestor['course_code'] = code.strip()[:10]
        self.ingestor.ingest_course_eval()
