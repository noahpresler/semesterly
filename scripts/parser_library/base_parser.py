# @what   Base Parse (Course)
# @org    Semeseter.ly
# @author Michael N. Miller
# @date	  2/01/2017

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import re, os, progressbar, argparse

from abc import ABCMeta, abstractmethod

from scripts.parser_library.Requester import Requester
from scripts.parser_library.ingestor import Ingestor
from scripts.parser_library.Extractor import Extractor
from scripts.parser_library.Updater import ProgressBar
from scripts.parser_library.internal_exceptions import CourseParseError
from scripts.parser_library.words import conjunctions_and_prepositions

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
		hide_progress_bar=True,
		tracker=None):

		self.school = school
		self.requester = Requester()
		self.extractor = Extractor()

		self.ingestor = Ingestor(school,
			validate=validate,
			config=config,
			output_filepath=output_filepath,
			output_error_filepath=output_error_filepath,
			break_on_error=break_on_error,
			break_on_warning=break_on_warning,
			skip_shallow_duplicates=skip_shallow_duplicates,
			hide_progress_bar=hide_progress_bar,
			tracker=tracker)

	@abstractmethod
	def start(self, **kwargs):
		'''Start the parse.'''

	def wrap_up(self):
		self.ingestor.wrap_up()

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

	ROMAN_NUMERAL = re.compile(r'^[iv]+$')

	@staticmethod
	def titlize(name):
		'''Title and keep roman numerals uppercase.'''
		name = name.lower()
		titled = ''
		for word in name.split():
			if CourseParser.ROMAN_NUMERAL.match(word) is not None:
				titled += word.upper()
			else:
				titled += word.lower() if word in conjunctions_and_prepositions else word.title()
			titled += ' '
		return titled.strip()
		# re.sub(r' ([IiVv]+[ $])', lambda match: ' {}'.format(match.group(1).upper()), course['Title'].title())
