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

import logging.config
import os
import yaml


def qualify(filename):
    """Wrap filename in absolute path.

    Args:
        filename (str)

    Returns:
        str: fully-qualified filename
    """
    return os.path.join(os.path.dirname(__file__), filename)


def load_school_logger(school):
    """Load logger for school.

    Args:
        name (str): module name.
    """
    with open(os.path.join(os.path.dirname(__file__), 'logging.yaml'), 'r') as file:
        config = file.read().format(
            parsing_log_filename=os.path.join(os.path.dirname(__file__),
                                              school,
                                              'logs',
                                              'parsing.log'),
            module='parsing.schools.' + school
        )
    logging.config.dictConfig(yaml.safe_load(config))
