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

import datetime

from timeit import default_timer as timer

from parsing.library.exceptions import PipelineError


class TrackerError(PipelineError):
    """Tracker error class."""


class Tracker:
    """Tracks specified attributes and broadcasts to viewers.

    @property attributes are defined for all BROADCAST_TYPES
    """

    BROADCAST_TYPES = {
        'SCHOOL',
        'YEAR',
        'TERM',
        'DEPARTMENT',
        'STATS',
        'INSTRUCTOR',
        'TIME',
        'MODE',
    }

    def __init__(self):
        """Initialize tracker object."""
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

            # NOTE: closure methods are used to capture the variables
            #       in their current context of the loop.

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
        """End tracker and report to viewers."""
        self.end_time = timer()
        self.report()

    def add_viewer(self, viewer, name=None):
        """Add viewer to broadcast queue.

        Args:
            viewer (Viewer): Viewer to add.
            name (None, str, optional): Name the viewer.
        """
        if name is None:
            name = 'viewer{}'.format(len(self.viewers))
        self.viewers.append((name, viewer))

    def remove_viewer(self, name):
        """Remove all viewers that match name.

        Args:
            name (str): Viewer name to remove.
        """
        self.viewers = [v for v in self.viewers if v[0] != name]

    def has_viewer(self, name):
        """Determine if name exists in viewers.

        Args:
            name (str): The name to check against.

        Returns:
            bool: True if name in viewers else False
        """
        return name in dict(self.viewers)

    def get_viewer(self, name):
        """Get viewer by name.

        Will return arbitrary match if multiple viewers with same name exist.

        Args:
            name (str): Viewer name to get.

        Returns:
            Viewer: Viewer instance if found, else None
        """
        return dict(self.viewers).get(name)

    def broadcast(self, broadcast_type):
        """Broadcast tracker update to viewers.

        Args:
            broadcast_type (str): message to go along broadcast bus.

        Raises:
            TrackerError: if broadcast_type is not in BROADCAST_TYPE.
        """
        if broadcast_type not in Tracker.BROADCAST_TYPES:
            raise TrackerError(
                'unsupported broadcast type {}'.format(broadcast_type)
            )
        # TODO - broadcast based on optional name argument
        for name, viewer in self.viewers:
            viewer.receive(self, broadcast_type)

    def report(self):
        """Notify viewers that tracker has ended."""
        for name, viewer in self.viewers:
            viewer.report(self)


class NullTracker(Tracker):
    """Dummy tracker used as an interface placeholder."""

    def __init__(self, *args, **kwargs):
        """Construct null tracker."""
        super(NullTracker, self).__init__(*args, **kwargs)

    def broadcast(self, broadcast_type):
        """Do nothing."""

    def report(self):
        """Do nothing."""
