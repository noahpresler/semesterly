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

import django, os, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

COURSE_BASE_ID = Course.objects.latest('id').id
SECTION_BASE_ID = Section.objects.latest('id').id
OFFERING_BASE_ID = Offering.objects.latest('id').id

print("BASED IDs: C {0}, S {1}, O {2}".format(COURSE_BASE_ID,SECTION_BASE_ID,OFFERING_BASE_ID))

with open('everything.json') as data_file:
	data = json.load(data_file)
print("{0} Fixtures Detected".format(len(data)))

new_json = []

for fixture in data:
	if fixture['model'] == "timetable.course":
		fixture['pk'] = COURSE_BASE_ID + int(fixture['pk'])
	elif fixture['model'] == "timetable.section":
		fixture['pk'] = SECTION_BASE_ID + int(fixture['pk'])
		fixture['fields']['course'] = COURSE_BASE_ID + int(fixture['fields']['course'])
	elif fixture['model'] == "timetable.offering":
		fixture['pk'] = OFFERING_BASE_ID + int(fixture['pk'])
		fixture['fields']['section'] = SECTION_BASE_ID + int(fixture['fields']['section'])
	new_json.append(fixture)

with open('everything_redumped.json','w') as data_file:
	data_file.write(json.dumps(new_json))
	data_file.close()