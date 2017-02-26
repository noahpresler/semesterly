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
