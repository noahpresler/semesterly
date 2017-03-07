# @what   Base Parse (Course)
# @org    Semeseter.ly
# @author Michael N. Miller
# @date	  2/01/2017

import os, progressbar, argparse, re

from abc import ABCMeta, abstractmethod

from scripts.parser_library.Requester import Requester
from scripts.parser_library.Ingestor import Ingestor
from scripts.parser_library.Extractor import Extractor
from scripts.parser_library.Updater import ProgressBar
from scripts.parser_library.internal_exceptions import CourseParseError

class BaseParser:
	__metaclass__ = ABCMeta

	def __init__(self, school, 
		validate=True,
		config=None,
		output_filepath=None, # TODO - support stdout
		output_error_filepath=None,
		break_on_error=True,
		break_on_warning=False,
		skip_shallow_duplicates=True,
		hide_progress_bar=True):
		self.school = school
		self.requester = Requester()
		self.extractor = Extractor()
		self.hide_progress_bar = hide_progress_bar
		if not self.hide_progress_bar:
			self.progressbar = ProgressBar(school)

		self.ingestor = Ingestor(school,
			validate=validate,
			config=config,
			output_filepath=output_filepath,
			output_error_filepath=output_error_filepath,
			break_on_error=break_on_error,
			break_on_warning=break_on_warning,
			update_progress=(lambda *args, **kwargs: None) if hide_progress_bar else self.progressbar.update,
			skip_shallow_duplicates=skip_shallow_duplicates)

	@abstractmethod
	def start(self, **kwargs):
		'''Start the parse.'''

	def get_stats(self):
		if not self.hide_progress_bar:
			return self.progressbar.stats
		else:
			return 'stats not logged'

class CourseParser(BaseParser):
	__metaclass__ = ABCMeta

	@abstractmethod
	def __init__(self, school, **kwargs):
		super(CourseParser, self).__init__(school, **kwargs)

	@abstractmethod
	def start(self, **kwargs):
		'''Start the parse.'''

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