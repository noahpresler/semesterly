import os, time, progressbar, argparse, re

from abc import ABCMeta, abstractmethod

import time, progressbar

from scripts.parser_library.Requester import Requester
from scripts.parser_library.Ingestor import Ingestor
from scripts.parser_library.Extractor import Extractor

class BaseParser:
	__metaclass__ = ABCMeta

	def __init__(self, school):
		self.school = school
		self.requester = Requester()
		self.ingest = Ingestor(school, update_progress=lambda **kwargs: self.update_progress(**kwargs))

		# Set progress bar to long or short dependent on terminal width
		if progressbar.utils.get_terminal_size()[0] < 70:
			self.progressbar = progressbar.ProgressBar(
				# redirect_stdout=True,
				# redirect_stderr=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', self.school, ') ',
					progressbar.FormatLabel('%(value)s')
				])
		else:
			self.progressbar = progressbar.ProgressBar(
				# redirect_stdout=True,
				# redirect_stderr=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', self.school, ')',
					' [', progressbar.Timer(), '] ',
					progressbar.FormatLabel('%(value)s')
				])

	@abstractmethod
	def start(self, **kwargs): pass

	def update_progress(self, **kwargs):
		'''Format progress bar and readjust size to fit terminal width.
		Two progress bars are defined in order to handle cramped scenarios more naturally. '''

		mode = ''
		if 'mode' in kwargs:
			mode = '==%s==' % (kwargs['mode'].title())

		format_stats = kwargs['_format']['function']
		contents = {key: value for key, value in kwargs.items() if key != 'mode' and key != '_format'}
		label_string = lambda x=None: ' | '.join('%s: %s' % (key[:x].title(), format_stats(contents[key])) for key in contents if contents[key]['total'] > 0)
		formatted_string = '%s | %s' % (mode, label_string(3))

		self.progressbar.update(formatted_string)

class CourseParser(BaseParser):
	__metaclass__ = ABCMeta

	def __init__(self, school, **kwargs):
		self.options = kwargs
		super(CourseParser, self).__init__(school)

	@abstractmethod
	def start(self, **kwargs): pass

	def get_args():
		parser = argparse.ArgumentParser(description='arg parse')
		parser.add_argument('-v', '--verbosity', action='count', default=1, required=False, 
			help='increase output verbosity (none + terms + depts + courses + all)') 
		parser.add_argument('--department', required=False, 
			help='parse specific department by code')
		parser.add_argument('--year-and-term', nargs=2, type=str, required=False)
		parser.add_argument('--detail', type=str, required=False,
			help='parser specific handle')
		textbooks = parser.add_mutually_exclusive_group(required=False)
		textbooks.add_argument('--textbooks', dest='textbooks', action='store_true',
			help='parse textbooks')
		textbooks.add_argument('--no-textbooks', dest='textbooks', action='store_false',
			help='don\'t parse textbooks')
		textbooks.set_defaults(textbooks=False)

		args = parser.parse_args()
		return args

	def check_args(args):
		return args
