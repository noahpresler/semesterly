"""
Parsing library tracking and logging.

@org    Semeseter.ly
@author Michael N. Miller
@date   07/02/2017
"""

from __future__ import absolute_import, division, print_function

import progressbar
import datetime
import simplejson as json

from abc import ABCMeta, abstractmethod
from timeit import default_timer as timer


def broadcast(track):
    """Decorator to broadcast tracking updates."""
    def wrapper(self, *args, **kwargs):
        track(self, *args, **kwargs)
        self.broadcast_update()
    return wrapper


class Tracker(object):
    """Tracks the state of a parse."""

    BROADCAST_TYPES = {
        'YEAR',
        'TERM',
        'DEPARTMENT',
        'COUNT'
    }

    def __init__(self, school):
        """Initialize tracker object."""
        self.school = school
        self.saw_error = False
        self.error = ''

        # TODO - should be moved to a viewer
        self.time_distribution = dict(_12=0, _24=0)

        # Consumers.
        self.counters = Counters()
        self.viewers = []

    def start(self):
        """Start timer of tracker object."""
        self.timestamp = datetime.datetime.utcnow().strftime(
            '%Y/%m/%d-%H:%M:%S'
        )
        self.start_time = timer()

    def finish(self):
        """End timer of tracker object."""
        self.end_time = timer()
        self.report()

    def add_viewer(self, viewer):
        """Add viewer to broadcast queue."""
        self.viewers.append(viewer)

    def set_mode(self, mode):
        """Stage of parsing pipeline being tracked (i.e. ingesting)."""
        self.mode = mode

    def see_error(self, msg):
        """Set error sighting to true when called.

        Args:
            msg{str}: message associated with error
        """
        self.saw_error = True
        self.error += msg + '\n'

    def set_cmd_options(self, cmd_options):
        self.cmd_options = cmd_options

    @broadcast
    def track_year(self, year):
        self.year = year

    @broadcast
    def track_term(self, term):
        self.term = term

    @broadcast
    def track_department(self, department):
        self.department = department

    @broadcast
    def track_count(self, subject, stat):
        self.counters.increment(subject, stat)

    @broadcast
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

    @broadcast
    def track_instructor(self, instructor_name):
        '''Track distrbution of instructor names.'''
        # TODO

    def broadcast_update(self):
        for viewer in self.viewers:
            viewer.receive_update(self)

    def report(self):
        for viewer in self.viewers:
            viewer.report(self)


class NullTracker(Tracker):
    """Dummy tracker used as an interface placeholder."""

    def __init__(self, *args, **kwargs):
        """Construct null tracker."""
        super(NullTracker, self).__init__('null', *args, **kwargs)

    def broadcast_update(self):
        pass  # Do nothing.

    def report(self):
        pass  # Do nothing.


class Counters(dict):
    """Dictionary counter for various stats."""

    def __init__(self):
        subjects = [
            'course',
            'section',
            'meeting',
            'textbook',
            'evaluation',
            'offering',
            'textbook_link'
        ]

        stats = ['valid', 'created', 'new', 'updated', 'total']
        super(Counters, self).__init__({
            subject: {
                stat: 0 for stat in stats
            } for subject in subjects
        })

    def increment(self, subject, stat):
        self[subject][stat] += 1

    def clear(self):
        for subject in self.counters:
            for stat in subject:
                subject[stat] = 0


class Viewer:
    """The frontend to a tracker object."""

    __metaclass__ = ABCMeta

    @abstractmethod
    def receive_update(self, tracker):
        """Incremental updates of tracking info."""

    @abstractmethod
    def report(self, tracker):
        """Final report of tracking info."""


class ProgressBar(Viewer):
    """Command line progress bar viewer for parsers."""

    TERMINAL_WIDTH_SWITCH_SIZE = 100

    def __init__(self, school, formatter=(lambda x: x)):
        # Set progress bar to long or short dependent on terminal width
        terminal_width = ProgressBar._get_terminal_size()
        if terminal_width < ProgressBar.TERMINAL_WIDTH_SWITCH_SIZE:
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
    def _get_terminal_size():
        return progressbar.utils.get_terminal_size()[0]

    def receive_update(self, tracker):
        counters = tracker.counters
        mode = '=={}=='.format(tracker.mode.upper())
        count_string = ' | '.join(('{}: {}'.format(k[:3].title(), self.formatter(counters[k])) for k in counters if counters[k]['total'] > 0))
        formatted_string = mode
        if ProgressBar._get_terminal_size() > ProgressBar.TERMINAL_WIDTH_SWITCH_SIZE:
            attrs = ['year', 'term', 'department']
            for attr in attrs:
                if not hasattr(tracker, attr):
                    continue
                if attr == 'department':
                    if 'code' in tracker.department:
                        formatted_string += ' | {}'.format(tracker.department['code'])
                    formatted_string += ' | {}'.format(tracker.department['name'])
                    continue
                formatted_string += ' | {}'.format(getattr(tracker, attr))
        formatted_string += ' | {}'.format(count_string)
        self.bar.update(formatted_string)

    def report(self, tracker):
        pass # do nothing

class LogFormatted(Viewer):
    def __init__(self, logpath):
        self.logpath = logpath

    def receive_update(self, tracker):
        pass  # do nothing.

    # TODO - report in valid json format
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
