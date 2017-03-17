from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import progressbar, sys, datetime, simplejson as json, sys
from timeit import default_timer as timer
from abc import ABCMeta, abstractmethod

class Tracker(object):
	def __init__(self, school):
		self.school = school
		self.time_distribution = dict(_12=0, _24=0)
		self.counters = Counters()
		self.viewers = []
		self.saw_error = False
		# self.seen = {} # Track seen courses and sections. # TODO

	def add_viewer(self, viewer):
		self.viewers.append(viewer)

	def set_mode(self, mode):
		self.mode = mode

	def set_cmd_options(self, cmd_options):
		self.cmd_options = cmd_options

	def start(self):
		self.timestamp = datetime.datetime.utcnow().strftime("%Y/%m/%d-%H:%M:%S")
		self.start_time = timer()

	def finish(self):
		self.end_time = timer()
		self.report()

	def see_error(self, msg):
		self.saw_error = True
		if not hasattr(self, 'error'):
			self.error = ''
		else:
			self.error += '\n'
		self.error += msg

	def track_year_and_term(self, year, term):
		self.year = year
		self.term = term

	def track_count(self, subject, stat):
		self.counters.increment(subject, stat)
		self.broadcast_update()

	def track_time(self, hour, minute):
		'''Update time granularity and 24hr time distribution to support time spread.
		Args:
			hour: a valid (24hr) hour
			minute: a valid minute
		'''
		if not hasattr(self, 'granularity'):
			self.granularity = 60

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

	def broadcast_update(self):
		for viewer in self.viewers:
			viewer.broadcast_update(self)

	def report(self):
		for viewer in self.viewers:
			viewer.report(self)

class NullTracker(Tracker):
	def __init__(self, *args, **kwargs):
		super(NullTracker, self).__init__('null', *args, **kwargs)

	def broadcast_update(self):
		pass # do nothing.

	def report(self):
		pass # do nothing.

class Counters(dict):
	'''Dictionary counter for various stats; to be passed with dict to update method in ProgressBar.'''
	def __init__(self):
		subjects = ['course', 'section', 'meeting', 'textbook', 'evaluation', 'offering', 'textbook_link']
		stats = ['valid', 'created', 'new', 'updated', 'total']
		super(Counters, self).__init__({subject: {stat: 0 for stat in stats} for subject in subjects})

	def increment(self, subject, stat):
		self[subject][stat] += 1

	def clear(self):
		for subject in self.counters:
			for stat in subject:
				subject[stat] = 0

class Viewer:
	'''The frontend to a tracker object.'''
	__metaclass__ = ABCMeta

	@abstractmethod
	def broadcast_update(self, tracker):
		'''Incremental updates of tracking info.'''

	@abstractmethod
	def report(self, tracker):
		'''Final report of tracking info.'''

class ProgressBar(Viewer):
	terminal_width_switch_size = 100

	def __init__(self, school, formatter=(lambda x: x)):
		# Set progress bar to long or short dependent on terminal width
		terminal_width = ProgressBar.get_terminal_size()
		if terminal_width < ProgressBar.terminal_width_switch_size:
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

	@staticmethod
	def get_terminal_size():
		return progressbar.utils.get_terminal_size()[0]

	def broadcast_update(self, tracker):
		counters = tracker.counters
		mode = '=={}=='.format(tracker.mode.upper())
		label_string = ' | '.join(('{}: {}'.format(k[:3].title(), self.formatter(counters[k])) for k in counters if counters[k]['total'] > 0))
		if ProgressBar.get_terminal_size() > ProgressBar.terminal_width_switch_size and hasattr(tracker, 'year') and hasattr(tracker, 'term'):
			formatted_string = '{} | {} {} | {}'.format(mode, tracker.term, tracker.year, label_string)
		else:
			formatted_string = '{} | {}'.format(mode, label_string)
		self.bar.update(formatted_string)

	def report(self, tracker):
		pass # do nothing

class LogFormatted(Viewer):
	def __init__(self, logpath):
		self.logpath = logpath

	def broadcast_update(self, tracker):
		pass # do nothing.

	def report(self, tracker):
		json_str = lambda j: json.dumps(j, sort_keys=True, indent=2, separators=(',', ': '))
		with open(self.logpath, 'a') as log:
			print('='*40, file=log)
			print('{}'.format(tracker.school.upper()), file=log)
			print('=={}=='.format(tracker.mode.upper()), file=log)
			if tracker.saw_error:
				print('FAILED:\n\n{}'.format(tracker.error), file=log)
			print('TIMESTAMP (UTC): {}'.format(tracker.timestamp), file=log)
			print('ELAPSED: {}'.format(str(datetime.timedelta(seconds=int(tracker.end_time - tracker.start_time)))), file=log)
			if hasattr(tracker, 'cmd_options'):
				print('COMMAND OPTIONS:\n{}'.format(json_str(tracker.cmd_options)), file=log)
			statistics = { subject: {stat: value for stat, value in stats.items() if value != 0} for subject, stats in tracker.counters.items() if len(stats) > 0 }
			print('STATS:\n{}'.format(json_str(statistics)), file=log)
			if hasattr(tracker, 'granularity'):
				print('calculated granularity: {}'.format(tracker.granularity), file=log)
