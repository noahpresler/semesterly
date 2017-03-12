from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import progressbar, sys, datetime, simplejson as json
from timeit import default_timer as timer
from abc import ABCMeta, abstractmethod

class Tracker:
	def __init__(self, school):
		self.school = school
		self.granularity = 60
		self.time_distribution = dict(_12=0, _24=0)
		self.counters = Counters()
		self.viewers = []
		# self.seen = {} # Track seen courses and sections. # TODO

	def add_viewer(self, viewer):
		self.viewers.append(viewer)

	def set_mode(self, mode):
		self.mode = mode

	def start(self):
		self.timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")
		self.start_time = timer()

	def finish(self):
		self.end_time = timer()
		self.report()

	def track_count(self, subject, stat):
		self.counters.increment(subject, stat)
		print(subject, stat)
		# self.update()

	def track_time(self, hour, minute):
		'''Update time granularity and 24hr time distribution to support time spread.
		Args:
			hour: a valid (24hr) hour
			minute: a valid minute
		'''
		if hour > 13:
			self.time_distribution['_24'] += 1
		else:
			self.time_distribution['_12'] += 1

		grains = [60, 30, 20, 15, 10, 5, 3, 2, 1]
		for grain in grains:
			if minute % grain == 0:
				if grain < self.granularity:
					self.granularity = grain
				break

	def track_instructor(self, instructor_name):
		'''Track distrbution of instructor names.'''
		# TODO

	def update(self):
		for viewer in self.viewers:
			viewer.update(self)

	def report(self):
		for viewer in self.viewers:
			viewer.report(self)

class Counters:
	'''Dictionary counter for various stats; to be passed with dict to update method in ProgressBar.'''
	def __init__(self):
		subjects = ['course', 'section', 'meeting', 'textbook', 'evaluation', 'offering', 'textbook_link']
		stats = ['valid', 'created', 'new', 'updated', 'total']
		self.counters = {subject: {stat: 0 for stat in stats} for subject in subjects}

	def dict(self):
		return self.counters

	def increment(self, subject, stat):
		self.counters[subject][stat] += 1

	def clear(self):
		for subject in self.counters:
			for stat in subject:
				subject[stat] = 0

class Viewer:
	'''The frontend to a tracker object.'''
	__metaclass__ = ABCMeta

	@abstractmethod
	def update(self, tracker):
		'''Incremental updates of tracking info.'''

	@abstractmethod
	def report(self, tracker):
		'''Final report of tracking info.'''

class ProgressBar(Viewer):
	def __init__(self, school, formatter=(lambda x: x)):
		# Set progress bar to long or short dependent on terminal width
		terminal_width = progressbar.utils.get_terminal_size()[0]
		if terminal_width < 100:
			self.bar = progressbar.ProgressBar(
				redirect_stdout=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', school, ') ',
					progressbar.FormatLabel('%(value)s')
				])
		else:
			self.bar = progressbar.ProgressBar(
				redirect_stdout=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', school, ')',
					' [', progressbar.Timer(), '] ',
					progressbar.FormatLabel('%(value)s')
				])
		self.formatter = formatter
		super(Viewer, self).__init__()

	def update(self, tracker):
		counters = tracker.counters
		mode = tracker.mode
		mode = '=={}=='.format(mode.upper())
		label_string = ' | '.join(('{}: {}'.format(k[:3].title(), self.formatter(counters[k])) for k in counters if counters[k]['total'] > 0))
		formatted_string = '{} | {}'.format(mode, label_string)
		self.bar.update(formatted_string)
		# self.stats = formatted_string # grab run stats

	def report(self, tracker):
		pass

class LogFormatted(Viewer):
	def update(self, tracker):
		pass

	def report(self, tracker):
		print(tracker.counters)
		# TODO