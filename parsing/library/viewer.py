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

import dateutil
import progressbar

from abc import ABCMeta, abstractmethod

from parsing.library.exceptions import PipelineError


class ViewerError(PipelineError):
    """Viewer error class."""


class Viewer(metaclass=ABCMeta):
    """A view that is updated via a tracker object broadcast or report."""

    @abstractmethod
    def receive(self, tracker, broadcast_type):
        """Incremental updates of tracking info.

        Args:
            tracker (Tracker): Tracker instance.
            broadcast_type (str): Broadcast type emitted by tracker.
        """

    @abstractmethod
    def report(self, tracker):
        """Report all tracked info.

        Args:
            tracker (Tracker): Tracker instance.
        """


class Timer(progressbar.widgets.FormatLabel,
            progressbar.widgets.TimeSensitiveWidgetBase):
    """Custom timer created to take away 'Elapsed Time' string."""

    def __init__(self, format='%(elapsed)s', **kwargs):
        """Contruct Timer instance."""
        progressbar.widgets.FormatLabel.__init__(self,
                                                 format=format,
                                                 **kwargs)
        progressbar.widgets.TimeSensitiveWidgetBase.__init__(self,
                                                             **kwargs)


class StatProgressBar(Viewer):
    """Command line progress bar viewer for data pipeline."""

    SWITCH_SIZE = 100

    def __init__(self, stat_format='', statistics=None):
        """Construct instance of data pipeline progress bar."""
        self.statistics = statistics or StatView()
        self.stat_format = stat_format

        self.format_custom_text = progressbar.FormatCustomText(
            '(%(school)s) ==%(mode)s== %(stats)s',
        )

        self.bar = progressbar.ProgressBar(
            redirect_stdout=True,
            # max_value=progressbar.UnknownLength,
            widgets=[
                ' [', Timer(), '] ',
                self.format_custom_text,
            ])

    def receive(self, tracker, broadcast_type):
        """Incremental update to progress bar."""
        self.statistics.receive(tracker, broadcast_type)

        if (broadcast_type != 'SCHOOL' and
                broadcast_type != 'TERM' and
                broadcast_type != 'DEPARTMENT' and
                broadcast_type != 'STATS'):
            return

        counters = self.statistics.stats
        formatted_string = ''
        if progressbar.utils.get_terminal_size()[0] > StatProgressBar.SWITCH_SIZE:
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
        for data_type, counter in list(counters.items()):
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


class ETAProgressBar(Viewer):
    def __init__(self):

        self.format_custom_text = progressbar.FormatCustomText(
            '(%(school)s) ==%(mode)s== ',
        )

        self.bar = progressbar.ProgressBar(
            redirect_stdout=True,
            max_value=progressbar.UnknownLength,
            widgets=[
                ' [', Timer(), '] ',
                self.format_custom_text,
                progressbar.Bar(),
                '(', progressbar.ETA(), ')',
            ])

    def receive(self, tracker, broadcast_type):
        if broadcast_type != 'SCHOOL' and broadcast_type != 'MODE':
            return
        self.format_custom_text.update_mapping(school=tracker.school,
                                               mode=tracker.mode.upper())

    def report(self, tracker):
        """Do nothing."""


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
        if broadcast_type != 'STATS':
            return
        self._increment(tracker.stats['kind'], tracker.stats['status'])

    def report(self, tracker=None):
        """Dump stats."""
        return self.stats

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

        time = dateutil.parser.parse(getattr(tracker, broadcast_type.lower()))

        if time > dateutil.parser.parse('12:00pm'):
            self.time_distribution[24] += 1
        else:
            self.time_distribution[12] += 1

        minute = time.minute if time.minute != 0 else 60
        grains = [60, 30, 20, 15, 10, 5, 3, 2, 1]
        for grain in grains:
            if minute % grain != 0:
                continue
            if grain < self.granularity:
                self.granularity = grain
            break

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
