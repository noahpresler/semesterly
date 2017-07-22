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

import progressbar, sys

# TODO - the ProgressBar should have the Counter

class ProgressBar:
	'''Wrapper class to add some more formatting to Python progressbar package.'''
	def __init__(self, school):
		# Set progress bar to long or short dependent on terminal width
		if progressbar.utils.get_terminal_size()[0] < 100:
			self.bar = progressbar.ProgressBar(
				redirect_stdout=True,
				# redirect_stderr=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', school, ') ',
					progressbar.FormatLabel('%(value)s')
				])
		else:
			self.bar = progressbar.ProgressBar(
				redirect_stdout=True,
				# redirect_stderr=True,
				max_value=progressbar.UnknownLength,
				widgets=[
					' (', school, ')',
					' [', progressbar.Timer(), '] ',
					progressbar.FormatLabel('%(value)s')
				])
		self.stats = ''

	def update(self, mode, counters, formatter=(lambda x: x)):
		mode = '=={}=='.format(mode.upper())
		label_string = ' | '.join(('{}: {}'.format(k[:3].title(), formatter(counters[k])) for k in counters if counters[k]['total'] > 0))
		formatted_string = '{} | {}'.format(mode, label_string)
		self.bar.update(formatted_string)
		self.stats = formatted_string # grab run stats

class Counter:
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