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
import yaml


def load_school_logger(name):
    """Load logger for school.

    Args:
        name (str): module name.
    """
    with open('/'.join(name.split('.')[:-1] + ['logging.yaml']), 'r') as file:
        config = file.read().format(school=name.split('.')[-1],
                                    module=name)
    logging.config.dictConfig(yaml.safe_load(config))
