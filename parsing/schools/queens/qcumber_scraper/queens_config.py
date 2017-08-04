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

from semesterly.settings import get_secret

USER = get_secret('QUEENS_USER')
PASS = get_secret('QUEENS_PASS')
OUTPUT_DIR = "./data-dump"
PROFILE = None
MAX_RETRIES = 10
RETRY_SLEEP_SECONDS = 10
LOG_DIR = "./parsing/schools/queens/qcumber_scraper/logs"
SAVE_TO_DB = False # writes to JSON if False
