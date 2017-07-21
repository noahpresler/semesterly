"""Filler."""

from __future__ import absolute_import, division, print_function

import sys
import datetime
import dateutil.parser as dparser

from timeit import default_timer as timer

from scripts.parser_library.exceptions import PipelineError, PipelineWarning


class TrackerError(PipelineError):
    """Tracker error class."""


class TrackerWarning(PipelineWarning):
    """Tracker warning class."""


class Tracker(object):
    """Tracks specified attributes and broadcasts to viewers."""

    BROADCAST_TYPES = {
        'YEAR',
        'TERM',
        'DEPARTMENT',
        'STATUS',
        'INSTRUCTOR',
        'TIME',
        'MODE',
        'INVALID',
    }

    def __init__(self, school):
        """Initialize tracker object."""
        self.school = school
        self.saw_error = False
        self.error = ''

        # TODO - should be moved to a viewer
        self.time_distribution = dict(_12=0, _24=0)

        # Consumers.
        self.viewers = []

        self._create_tracking_properties()

    def _create_tracking_properties(self):
        """Create @property attributes for all BROADCAST_TYPES.

        This is equivalent to enumerating for each broadcast type::
            @property
            def year(self):
                return self._year

            @year.setter
            def year(self, value):
                self._year = value
                self.broadcast('YEAR')

        Will not override an attribute if an @property is already
        defined within the class for a broadcast type.
        """
        for btype in Tracker.BROADCAST_TYPES:
            name = btype.lower()
            storage_name = '_{}'.format(name)

            # If attribute is already part of class, do not override it.
            if (hasattr(self, storage_name) or hasattr(self.__class__, name) or
                    hasattr(self, name)):
                continue

            # NOTE: closure methods are used to capture the variables in their
            #       current context of the loop.

            def closure_getter(name, storage_name):
                def getter(self):
                    return getattr(self, storage_name)
                return getter

            def closure_setter(btype, name, storage_name):
                def setter(self, value):
                    setattr(self, storage_name, value)
                    self.broadcast(btype)
                return setter

            setattr(self.__class__, name, property(
                closure_getter(name, storage_name),
                closure_setter(btype, name, storage_name)
            ))

    def start(self):
        """Start timer of tracker object."""
        self.timestamp = datetime.datetime.utcnow().strftime(
            '%Y/%m/%d-%H:%M:%S'
        )
        self.start_time = timer()

    def end(self):
        """End tracker and report to viwers."""
        self.end_time = timer()
        self.report()

    def add_viewer(self, viewer):
        """Add viewer to broadcast queue."""
        self.viewers.append(viewer)

    def see_error(self, msg):
        """Set error sighting to true when called.

        Args:
            msg{str}: message associated with error
        """
        self.saw_error = True
        self.error += msg + '\n'

    def set_cmd_options(self, cmd_options):
        self.cmd_options = cmd_options

    def broadcast(self, broadcast_type):
        """Broadcast tracker update to viewers.

        Args:
            broadcast_type (str): message to go along broadcast bus.

        Raises:
            TrackerError: if broadcast_type is not in BROADCAST_TYPE.
        """
        if broadcast_type not in Tracker.BROADCAST_TYPES:
            raise TrackerError(
                'Unsupported broadcast type {}'.format(broadcast_type)
            )
        for viewer in self.viewers:
            viewer.receive(self, broadcast_type)

    def report(self):
        """Notify viewers that tracker has ended."""
        for viewer in self.viewers:
            viewer.report(self)


class NullTracker(Tracker):
    """Dummy tracker used as an interface placeholder."""

    def __init__(self, *args, **kwargs):
        """Construct null tracker."""
        super(NullTracker, self).__init__('null', *args, **kwargs)

    def broadcast(self, broadcast_type):
        """Do nothing."""

    def report(self):
        """Do nothing."""
