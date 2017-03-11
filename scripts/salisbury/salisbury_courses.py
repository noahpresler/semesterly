# @what    Salisbury Course Parser
# @org     Semester.ly
# @author  Michael N. Miller
# @date	   3/3/17

from __future__ import print_function

from scripts.new_peoplesoft.courses import PeoplesoftParser

class SalisburyParser(PeoplesoftParser):

	def __init__(self, **kwargs):
		school = 'salisbury'
		url = 'https://gullnet.salisbury.edu/psc/csprdguest/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL'
		super(SalisburyParser, self).__init__(school, url, **kwargs)

	def start(self,
		years=None,
		terms=None,
		departments=None,
		textbooks=True,
		verbosity=3,
		**kwargs):

		# Hotfix to narrow parsing range.
		if years is None:
			years = ['2016', '2017', '2018']

		self.parse(
			cmd_years=years,
			cmd_terms=terms,
			cmd_departments=departments,
			cmd_textbooks=textbooks,
			verbosity=verbosity)

from scripts.new_parser_library.Digestor import Digestor
from scripts.new_parser_library.Validator import Validator
from scripts.new_parser_library.internal_exceptions import *
from timeit import default_timer as timer
from simplejson.scanner import JSONDecodeError
import datetime, os, traceback

def main():
	timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")
	options = {}
	type_ = 'courses'
	school = 'salisbury'

	directory = 'scripts/salisbury'
	options['config_file'] = '{}/config.json'.format(directory)
	options['output'] = '{}/data/{}.json'.format(directory, type_)
	options['output_error_filepath'] = '{}/logs/error_{}.log'.format(directory, type_)
	options['log_stats'] = 'scripts/logs/master.log'

	has_validation_error = True
	stat_log = []
	try:
		p = SalisburyParser(
			validate=True,
			config=options['config_file'],
			output_filepath=options['output'],
			output_error_filepath=options['output_error_filepath'],
			break_on_error=True,
			break_on_warning=False,
			hide_progress_bar=False,
			skip_shallow_duplicates=True
		)

		start_time = timer()
		p.start(
			verbosity=0,
			years=['2017'],
			terms=['Spring'],
			departments=None,
			textbooks=True
		)
		end_time = timer()

		if hasattr(p, 'get_stats') and callable(p.get_stats):
			stat_log.append('({}) [Elapsed Time: {:.2f}s] {}'.format(school, end_time - start_time, p.get_stats()))
		else:
			stat_log.append('({}) [Elapsed Time: {:.2f}s] ==INGESTING=='.format(school, end_time - start_time))

		has_validation_error = False
	except CourseParseError as e:
		error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
		stat_log.append(error + '\n' + traceback.format_exc())
	except (JsonValidationError, JsonValidationWarning, IngestorWarning) as e:
		error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
		stat_log.append(error + '\n' + traceback.format_exc())
	except Exception as e:
		error = "Error while parsing %s:\n\n%s\n" % (school, str(e))
		stat_log.append(error + '\n' + traceback.format_exc())

	log_stats(options['log_stats'], stats=stat_log, options=options, timestamp=timestamp)

	# Do not digest invalid data
	if has_validation_error:
		return

	# Digestor.
	timestamp = datetime.datetime.now().strftime("%Y/%m/%d-%H:%M:%S")
	stats = []
	options = {}
	options['data'] = '{}/data/{}.json'.format(directory, type_)
	options['log_stats'] = 'scripts/logs/master.log'
	options['output_diff'] = '{}/logs/digest_{}_diff.log.json'.format(directory, type_)

	try:
		d = Digestor(school,
			data=options['data'],
			output=options['output_diff'],
			diff=True,
			load=True
		)

		start_time = timer()
		d.digest()
		end_time = timer()
		stats.append('({}) [Elapsed Time: {:.2f}s] {}'.format(school, end_time - start_time, d.get_stats()))

	except DigestionError as e:
		print(e, traceback.format_exc())
		print('unexpected error in salisbury digestion')
		stats.append(traceback.format_exc())
	except Exception as e:
		print(e, traceback.format_exc())
		print('unexpected error in salisbury digestion')
		stats.append(traceback.format_exc())

	log_stats(options['log_stats'], stats=stats, options=options, timestamp=timestamp)

def log_stats(filepath, options='', stats=None, timestamp='', elapsed=None):
	'''Append run stat to master log.'''
	formatted_string = ''

	if timestamp:
		formatted_string += 'TIMESTAMP: ' + timestamp + '\n'
	if elapsed:
		formatted_string += 'ELAPSED: ' + str(elapsed) + '\n'
	if stats:
		formatted_string += '\n'.join(stat for stat in stats) + '\n'
	if options:
		formatted_string += 'OPTIONS:\n' + json.dumps(options, sort_keys=True, indent=2, separators=(',', ': ')) + '\n'

	with open(filepath, 'a') as log:
		log.write(formatted_string)
		log.write('='*40 + '\n')

if __name__ == "__main__":
	main()
