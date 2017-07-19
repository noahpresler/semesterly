"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

import os
import sys
import re
import django
from bs4 import BeautifulSoup
import urllib
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

class HopkinsEvalParser:
	def __init__(self):
		self.code_pattern = re.compile(r"^.*\..*\..*\..*$")
		self.score_pattern = re.compile(r".*(\d\.\d\d).*")
		self.summary_pattern = re.compile(r"Summary:.*|This class had 5 or fewer comments\.")
		self.thresh_pattern = re.compile(r"This class had 5 or fewer comments\.")
		self.code_cap_pattern = re.compile(r"^.*\.(.*\..*)\..*$")
		self.current_year = None

	def parse_evals(self):
		for fn in os.listdir('./scripts/jhu/HopkinsEvaluations'):
			print "PARSING DATA FOR: " + os.path.splitext(fn)[0]
			self.current_year = os.path.splitext(fn)[0]
			html = self.get_eval_html(os.getcwd() + '/scripts/jhu/HopkinsEvaluations/' + fn)
			soup = BeautifulSoup(html,"html.parser")
			self.process_soup(soup)

	def process_soup(self,soup):
		course_codes = list(set(soup.find_all('b',text=self.code_pattern)))
		for cc in course_codes:
			code = cc.contents[0]
			title = cc.find_next('b').contents[0]
			prof = title.find_next('b').contents[0]
			score = self.get_score(prof.find_next(text=self.score_pattern))
			summary = self.get_summary(title.find_next("p",text=self.summary_pattern))
			self.make_review_item(code,prof,score,summary,self.current_year)

	def get_summary(self,summary_header):
		if re.match(self.thresh_pattern,summary_header.text):
			return summary_header.text
		summary = []
		curr_tag = summary_header.find_next()
		while curr_tag is not None:
			if curr_tag.name == "p":
				if curr_tag.text.find("write-in") != -1:
					break
				elif 'left:450px;' not in curr_tag['style'] and len(curr_tag.find_all()) == 0:
					summary.append(curr_tag.text)
				elif "left:108px" in curr_tag['style'] and re.match(self.code_pattern, curr_tag.text):
					break
			curr_tag = curr_tag.find_next()
		return "".join(summary)

	def get_score(self,raw):
		match = re.search(self.score_pattern,raw)
		return match.group(1)

	def make_review_item(self,code,prof,score,summary,year):
	 	courses = Course.objects.filter(code__contains = self.get_code_partial(code), school = "jhu")
	 	if len(courses) == 0:
	 		return
	 	else:
	 		course = courses[0]
	 		obj, created = Evaluation.objects.get_or_create(
	 			course=course,
	 			score=score,
	 			summary=summary,
	 			course_code=code[:20],
	 			professor=prof,
	 			year=year)
	 		if created:
	 			print "Evaluation Object CREATED for: " + code[:20]
	 		else:
	 			print "Evaluation Object FOUND for: " + code[:20]
		return

	def get_code_partial(self,code):
		matches = re.search(self.code_cap_pattern,code)
		return str(matches.group(1))

	def get_eval_html(self, file_name):
	    html = urllib.urlopen(file_name).read()
	    return html

if __name__ == '__main__':
	ep = HopkinsEvalParser()
	ep.parse_evals()