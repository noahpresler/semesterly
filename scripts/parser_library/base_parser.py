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

# @what   Base Parse (Course)
# @org    Semeseter.ly
# @author Michael N. Miller
# @date	  2/01/2017

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3
import re, os, progressbar, argparse
from abc import ABCMeta, abstractmethod
from scripts.parser_library.requester import Requester
from scripts.parser_library.ingestor import Ingestor
from scripts.parser_library.extractor import Extractor
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
