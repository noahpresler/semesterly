"""JHU Evaluation Parser."""

from __future__ import absolute_import, division, print_function

import os
import re
import sys

import urllib

from bs4 import BeautifulSoup

from scripts.parser_library.base_parser import BaseParser


class HopkinsEvalParser(BaseParser):

    CODE_PATTERN = re.compile(r'^.*\..*\..*\..*$')
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
        for fn in os.listdir('./scripts/jhu/HopkinsEvaluations'):
            print('PARSING DATA FOR:', os.path.splitext(fn)[0], file=sys.stderr)
            self.current_year = os.path.splitext(fn)[0]
            html = self._get_eval_html(
                '{}/scripts/jhu/HopkinsEvaluations/{}'.format(os.getcwd(), fn)
            )
            soup = BeautifulSoup(html, 'html.parser')
            self._process_soup(soup)

    def _process_soup(self, soup):
        course_codes = list(set(soup.find_all('b', text=HopkinsEvalParser.CODE_PATTERN)))
        for cc in course_codes:
            code = cc.contents[0]
            title = cc.find_next('b').contents[0]
            prof = title.find_next('b').contents[0]
            score = self._get_score(prof.find_next(text=HopkinsEvalParser.SCORE_PATTERN))
            summary = self._get_summary(title.find_next('p', text=HopkinsEvalParser.SUMMARY_PATTERN))
            self._make_review_item(code, prof, score, summary, self.current_year)

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
        return "".join(summary)

    def _get_score(self, raw):
        match = re.search(HopkinsEvalParser.SCORE_PATTERN, raw)
        return match.group(1)

    def _make_review_item(self, code, prof, score, summary, year):
        print(code, prof, score, summary, year, file=sys.stderr)
        # courses = Course.objects.filter(code__contains=self._get_code_partial(code),
        #                                 school="jhu")
        # if len(courses) == 0:
        #     return
        # else:
        #     course = courses[0]
        #     obj, created = Evaluation.objects.get_or_create(
        #         course=course,
        #         score=score,
        #         summary=summary,
        #         course_code=code[:20],
        #         professor=prof,
        #         year=year)
        #     if created:
        #         print("Evaluation Object CREATED for: " + code[:20], file=sys.stderr)
        #     else:
        #         print("Evaluation Object FOUND for: " + code[:20], file=sys.stderr)
        # return

    def _get_code_partial(self, code):
        matches = re.search(HopkinsEvalParser.CODE_CAP_PATTERN, code)
        return str(matches.group(1))

    def _get_eval_html(self, file_name):
        html = urllib.urlopen(file_name).read()
        return html

if __name__ == '__main__':
    ep = HopkinsEvalParser()
    ep.start()
