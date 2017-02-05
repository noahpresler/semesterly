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
		self.extractor = Extractor()

	@abstractmethod
	def start(self, **kwargs): pass

class CourseParser(BaseParser):
	__metaclass__ = ABCMeta

	def __init__(self, school,
		validate=True,
		config=None,
		output_filepath=None, # TODO - support stdout
		output_error_filepath=None,
		break_on_error=True,
		break_on_warning=False,
		hide_progress_bar=False):

		super(CourseParser, self).__init__(school)

		if not hide_progress_bar:
			self.progressbar = self.set_progressbar()
		update_progress = (lambda *args, **kwargs: None) if hide_progress_bar else (lambda **kwargs: self.update_progress(**kwargs))

		self.ingestor = Ingestor(school,
			validate=validate,
			config=config,
			output_filepath=output_filepath,
			output_error_filepath=output_error_filepath,
			break_on_error=break_on_error,
			break_on_warning=break_on_warning,
			update_progress=update_progress)

	@abstractmethod
	def start(self, **kwargs): pass

	def set_progressbar(self):
		# Set progress bar to long or short dependent on terminal width
		if progressbar.utils.get_terminal_size()[0] < 70:
			return progressbar.ProgressBar(
				redirect_stdout=True,
				# redirect_stderr=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', self.school, ') ',
					progressbar.FormatLabel('%(value)s')
				])
		else:
			return progressbar.ProgressBar(
				redirect_stdout=True,
				# redirect_stderr=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', self.school, ')',
					' [', progressbar.Timer(), '] ',
					progressbar.FormatLabel('%(value)s')
				])

	def update_progress(self, **kwargs): # TODO - remove kwargs and make counter raw dictionary
		'''Format progress bar and readjust size to fit terminal width.
		Two progress bars are defined in order to handle cramped scenarios more naturally.'''

		mode = ''
		if 'mode' in kwargs:
			mode = '==%s==' % (kwargs['mode'].title())

		format_stats = kwargs['_format']['function']
		contents = {key: value for key, value in kwargs.items() if key != 'mode' and key != '_format'}
		label_string = lambda x=None: ' | '.join('%s: %s' % (key[:x].title(), format_stats(contents[key])) for key in contents if contents[key]['total'] > 0)
		formatted_string = '%s | %s' % (mode, label_string(3))

		self.progressbar.update(formatted_string)
