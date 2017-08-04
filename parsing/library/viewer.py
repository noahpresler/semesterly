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

from __future__ import absolute_import, division, print_function

import datetime
import progressbar
import dateutil.parser as dparser

from abc import ABCMeta, abstractmethod

from parsing.library.utils import pretty_json
from parsing.library.exceptions import PipelineError


class ViewerError(PipelineError):
    """Viewer error class."""


class Viewer(object):
    """A view that is updated via a tracker object broadcast or report."""

    __metaclass__ = ABCMeta

    @abstractmethod
    def receive(self, tracker, broadcast_type):
        """Incremental updates of tracking info.

        Args:
            tracker (parsing.library.tracker.Tracker): Tracker instance.
            broadcast_type (str): Broadcast type emitted by tracker.
        """

    @abstractmethod
    def report(self, tracker):
        """Report all tracked info.

        Args:
            tracker (parsing.library.tracker.Tracker): Tracker instance.
        """


class ProgressBar(Viewer):
    """Command line progress bar viewer for data pipeline."""

    SWITCH_SIZE = 100

    class Timer(progressbar.widgets.FormatLabel,
                progressbar.widgets.TimeSensitiveWidgetBase):
        """Custom timer created to take away 'Elapsed Time' string."""

        def __init__(self, format='%(elapsed)s', **kwargs):
            """Contruct Timer."""
            progressbar.widgets.FormatLabel.__init__(self,
                                                     format=format,
                                                     **kwargs)
            progressbar.widgets.TimeSensitiveWidgetBase.__init__(self,
                                                                 **kwargs)

    def __init__(self, stat_format=''):
        """Construct instance of data pipeline progress bar."""
        self.statuses = StatView()
        self.stat_format = stat_format

        self.format_custom_text = progressbar.FormatCustomText(
            '(%(school)s) ==%(mode)s== %(stats)s',
        )

        self.bar = progressbar.ProgressBar(
            redirect_stdout=True,
            max_value=progressbar.UnknownLength,
            widgets=[
                ' [', ProgressBar.Timer(), '] ',
                self.format_custom_text,
            ])

    def receive(self, tracker, broadcast_type):
        """Incremental update to progress bar."""
        self.statuses.receive(tracker, broadcast_type)
        counters = self.statuses.stats
        formatted_string = ''
        if progressbar.utils.get_terminal_size()[0] > ProgressBar.SWITCH_SIZE:
            attrs = ['year', 'term', 'department']
            for attr in attrs:
                if not hasattr(tracker, attr):
                    continue
                if attr == 'department':
                    if 'code' in tracker.department:
                        formatted_string += ' | {}'.format(
                            tracker.department['code']
                        )
                    else:
                        formatted_string += ' | {}'.format(
                            tracker.department['name']
                        )
                    continue
                formatted_string += ' | {}'.format(getattr(tracker, attr))
        for data_type, counter in counters.items():
            if counter['total'] == 0:
                continue
            formatted_string += ' | {label}: {stat}'.format(
                label=data_type[:3].title(),
                stat=self.stat_format.format(
                    new=counter['new'],
                    valid=counter['valid'],
                    total=counter['total'],
                    created=counter['created'],
                    updated=counter['updated']
                )
            )
        self.format_custom_text.update_mapping(school=tracker.school,
                                               mode=tracker.mode.upper(),
                                               stats=formatted_string)
        self.bar.update()

    def report(self, tracker):
        """Do nothing."""


class LogFormatted(Viewer):
    def __init__(self, logpath):
        self.logpath = logpath
        self.statuses = StatView()

    def receive(self, tracker, broadcast_type):
        self.statuses.receive(tracker, broadcast_type)

    # TODO - report in valid json format
    def report(self, tracker):
        with open(self.logpath, 'a') as log:
            print('=' * 40, file=log)
            print('{}'.format(tracker.school.upper()), file=log)
            print('=={}=='.format(tracker.mode.upper()), file=log)
            if tracker.saw_error:
                print('FAILED:\n\n{}'.format(tracker.error), file=log)
            print('TIMESTAMP (UTC): {}'.format(tracker.timestamp), file=log)
            print('ELAPSED: {}'.format(str(datetime.timedelta(seconds=int(tracker.end_time - tracker.start_time)))), file=log)
            if hasattr(tracker, 'cmd_options'):
                print('COMMAND OPTIONS:\n{}'.format(pretty_json(tracker.cmd_options)), file=log)
            statistics = {
                subject: {
                    stat: value for stat, value in stats.items() if value != 0
                } for subject, stats in self.statuses.stats.items() if len(stats) > 0
            }
            print('STATS:\n{}'.format(pretty_json(statistics)), file=log)
            if hasattr(tracker, 'granularity'):
                print('calculated granularity: {}'.format(tracker.granularity), file=log)


class StatView(Viewer):
    """Keeps view of statistics of objects processed pipeline.

    Attributes:
        KINDS (tuple): The kinds of objects that can be tracked.
            TODO - move this to a shared space w/Validator
        LABELS (tuple): The status labels of objects that can be tracked.
        stats (dict): The view itself of the stats.
    """

    # TODO - move to central location w/Validator/schema kinds
    KINDS = (
        'course',
        'section',
        'meeting',
        'textbook',
        'evaluation',
        'offering',
        'textbook_link',
        'eval',
    )

    LABELS = ('valid', 'created', 'new', 'updated', 'total')

    def __init__(self):
        """Construct StatView instance."""
        self.stats = {
            subject: {
                stat: 0 for stat in StatView.LABELS
            } for subject in StatView.KINDS
        }

    def __iter__(self):
        """Create iterator for StatView dictionary.

        Returns:
            iterator: Iterator over internal dictionary.
        """
        return iter(self.stats)

    def __getitem__(self, key):
        """Get item from stat dictionary.

        Args:
            key (str): One of kinds.

        Returns:
            TYPE: Description
        """
        return self.stats[key]

    def receive(self, tracker, broadcast_type):
        """Receive an update from a tracker.

        Ignore all broadcasts that are not STATUS.

        Args:
            tracker (parsing.library.tracker.Tracker):
                Tracker receiving update from.
            broadcast_type (str): Broadcast message from tracker.
        """
        if broadcast_type != 'STATUS':
            return
        self._increment(tracker.status['kind'], tracker.status['status'])

    def report(self, tracker):
        """Do nothing."""

    def _increment(self, kind, status):
        self.stats[kind][status] += 1


class TimeDistributionView(Viewer):
    """Viewer to analyze time distribution.

    Calculates granularity and holds report and 12, 24hr distribution.

    Attributes:
        distribution (dict): Contains counts of 12 and 24hr sightings.
        granularity (int): Time granularity of viewed times.
    """

    def __init__(self):
        """Construct TimeDistributionView."""
        self.distribution = {
            12: 0,
            24: 0
        }

        self.granularity = 60

    def receive(self, tracker, broadcast_type):
        """Receive an update from a tracker.

        Ignore all broadcasts that are not TIME.

        Args:
            tracker (parsing.library.tracker.Tracker):
                Tracker receiving update from.
            broadcast_type (str): Broadcast message from tracker.
        """
        if broadcast_type != 'TIME':
            return

        time = getattr(tracker, broadcast_type.lower())
        dparser.parse(time)

        # TODO - analyze distribution and track granularity

        # if hour > 12:
        #     self.time_distribution['_24'] += 1
        # else:
        #     self.time_distribution['_12'] += 1

        # grains = [60, 30, 20, 15, 10, 5, 3, 2, 1]
        # for grain in grains:
        #     if minute % grain == 0:
        #         if grain < self.granularity:
        #             self.granularity = grain
        #         break

    def report(self, tracker):
        """Do nothing."""


class Hoarder(Viewer):
    """Accumulate a log of some properties of the tracker."""

    def __init__(self):
        """Create Hoarder instance."""
        self._schools = {}

    @property
    def schools(self):
        """Get schools attribute (i.e. self.schools).

        Returns:
            dict: Value of schools storage value.
        """
        return self._schools

    @schools.setter
    def schools(self, value):
        self._schools = value

    def receive(self, tracker, broadcast_type):
        """Receive an update from a tracker.

        Ignore all broadcasts that are not TIME.

        Args:
            tracker (parsing.library.tracker.Tracker):
                Tracker receiving update from.
            broadcast_type (str): Broadcast message from tracker.
        """
        if broadcast_type == 'TERM':
            try:
                semesters = self.schools.setdefault(tracker.school, {})
                terms = semesters.setdefault(tracker.year, [])
                if tracker.term not in set(terms):
                    terms.append(tracker.term)
            except AttributeError:
                pass

        # elif broadcast_type == 'INSTRUCTOR':
        #     try:
        #         instructors = self.schools.setdefault(tracker.school, [])
        #         instructors.add(tracker.instructor)
        #     except AttributeError:
        #         pass

        # elif broadcast_type == 'DEPARTMENT':
        #     try:
        #         departments = self.schools.setdefault(tracker.school, [])
        #         departments.add(tracker.department)
        #     except AttributeError:
        #         pass

    def report(self, tracker):
        """Do nothing."""
