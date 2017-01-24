import os, time, progressbar, argparse

from abc import ABCMeta
from scripts.parser_library.Requester import Requester
from scripts.parser_library.Ingestor import Ingestor

bar = progressbar.ProgressBar(max_value=progressbar.UnknownLength)
for i in range(20):
	time.sleep(0.1)
	bar.update(i)

bar = progressbar.ProgressBar()
for i in bar(range(100)):
	time.sleep(0.02)

bar = progressbar.ProgressBar(redirect_stdout=True)
for i in range(100):
	print 'Some text', i
	time.sleep(0.1)
	bar.update(i)

bar = progressbar.ProgressBar(widgets=[
	' [', progressbar.Timer(), '] ',
	progressbar.Bar(),
	' (', progressbar.ETA(), ') ',
])
for i in bar(range(20)):
	time.sleep(0.1)

class Parser:
	__metaclass__ = ABCMeta

	def __init__(self, school):
		self.school = school
		self.requester = Requester()
		self.ingest = Ingestor(school)


	@abstractmethod
	def parse(self, **kwargs): pass
		''' Parse! '''

class CourseParser(Parser):
	__metaclass__ = ABCMeta

	def __init__(self, school):
		Parser.__init__(self, school)

	@abstractmethod
	def parse(self, **kwargs): pass
		''' Parse! '''

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
		textbooks.set_defaults(textbooks=True)

		args = parser.parse_args()

	def check_args(args):
		return args
