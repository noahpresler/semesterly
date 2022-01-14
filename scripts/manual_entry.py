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
import traceback
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from parsing.library.utils import is_short_course
from timetable.school_mappers import SCHOOLS_MAP

if len(sys.argv) < 3:
    print("Please specify a school and semester.")
    exit(0)
school = sys.argv[1]
semester = sys.argv[2]

section_type_map = {
      'LEC': 'L',
      'TUT': 'T',
      'LAB': 'P',
    }
days = ['_', 'M', 'T', 'W', 'R', 'F']

print("Manual entry starting for " + school)

while True:
	try:
		cont = input("ENTER COURSE? Y/N")
		if cont != 'Y':
			print("EXITTING")
			exit(1) 

		name = input("Enter course name: ") 
		code = input("Enter course code: ")
		desc = input("Enter description: ")
		prereqs = input("Enter preqreqs: ")
		credits = float(input("Enter credits: "))
		areas = input("Enter areas: ")   
		dept = input("Enter department: ")
		level = int(input("Enter level: "))

		course, CourseCreated = Course.objects.update_or_create(
            code = code,
            school = school,
            defaults={
                'name': name,
                'description': desc,
                'areas': areas,
                'prerequisites': prereqs,
                'num_credits': credits,
                'level': level,
                'department': dept
            }
        )
		print("-----------------COURSE CREATED----------------")

		while course and True:
			cont = input("ENTER SECTION? Y/N")
			if cont != 'Y':
				break

			section_code = input("Section code: ")
			print(section_type_map)
			section_type = input("Section type: ")
			instructors = input("Instructors: ")
			size = int(input("Size: "))
			waitlist_size = int(input("Waitlist Size: "))
			enrolment = int(input("Enrollment: "))
			waitlist = int(input("Waitlist: "))


			section, section_created = Section.objects.update_or_create(
			        course = course,
			        semester = semester.upper()[:1],
			        meeting_section = section_code,
			        section_type = section_type,
			        defaults = {
			            'instructors': instructors,
			            'size': size,
			            'enrolment': enrolment,
			            'waitlist': waitlist,
			            'waitlist_size': waitlist_size 
			        }
			    )

			print("-----------------SECTION CREATED----------------")

			while section and True:
				cont = input("ENTER OFFERING? Y/N")
				if cont != 'Y':
					print("EXITTING")
					break 

				print(days)

				short_course_weeks_limit = SCHOOLS_MAP[school].short_course_weeks_limit
				day = input("day: ")
				start = input("time_start (XX:YY) : ")
				end = input("time_end (XX:YY) : ")
				offer_date_start = input("date_start mm-dd-yyyy : ")
				offer_date_end = input("date_end mm-dd-yyyy : ")
				location = input("location: ")
				offering, OfferingCreated = Offering.objects.update_or_create(
						section = section,
						day = day,
						time_start = start,
						time_end = end,
						date_start = offer_date_start,
						date_end = offer_date_end,
						is_short_course = is_short_course(date_start, date_end, short_course_weeks_limit),
						defaults = {
					    	'location':location
						}
					)

				print("-----------------OFFERING CREATED----------------")



	except EOFError:
		print("EXITING")
		exit(0)
