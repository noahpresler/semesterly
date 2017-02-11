import progressbar

class ProgressBar:
	def __init__(self, school):
		# Set progress bar to long or short dependent on terminal width
		if progressbar.utils.get_terminal_size()[0] < 70:
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

	def update(self, mode, counters, formatter=lambda x: x):
		mode = '=={}=='.format(mode.title())
		contents = {key: value for key, value in counters.items()}
		label_string = lambda x=None: ' | '.join('{}: {}'.format(k[:x].title(), formatter(contents[k])) for k in contents if contents[k]['total'] > 0)
		formatted_string = '{} | {}'.format(mode, label_string(3))
		self.bar.update(formatted_string)
