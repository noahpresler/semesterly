import django, os, json
import traceback
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

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

print "Manual entry starting for " + school

while True:
	try:
		cont = raw_input("ENTER COURSE? Y/N")
		if cont != 'Y':
			print "EXITTING"
			exit(1) 

		name = raw_input("Enter course name: ") 
		code = raw_input("Enter course code: ")
		desc = raw_input("Enter description: ")
		prereqs = raw_input("Enter preqreqs: ")
		credits = float(raw_input("Enter credits: "))
		areas = raw_input("Enter areas: ")   
		dept = raw_input("Enter department: ")
		level = int(raw_input("Enter level: "))

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
		print "-----------------COURSE CREATED----------------"

		while course and True:
			cont = raw_input("ENTER SECTION? Y/N")
			if cont != 'Y':
				break

			section_code = raw_input("Section code: ")
			print section_type_map
			section_type = raw_input("Section type: ")
			instructors = raw_input("Instructors: ")
			size = int(raw_input("Size: "))
			waitlist_size = int(raw_input("Waitlist Size: "))
			enrolment = int(raw_input("Enrollment: "))
			waitlist = int(raw_input("Waitlist: "))


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

			print "-----------------SECTION CREATED----------------"

			while section and True:
				cont = raw_input("ENTER OFFERING? Y/N")
				if cont != 'Y':
					print "EXITTING"
					break 

				print days
				day = raw_input("day: ")
				start = raw_input("time_start (XX:YY) : ")
				end = raw_input("time_end (XX:YY) : ")
				location = raw_input("location: ")

				offering, OfferingCreated = Offering.objects.update_or_create(
						section = section,
						day = day,
						time_start = start,
						time_end = end,
						defaults = {
					    	'location':location
						}
					)

				print "-----------------OFFERING CREATED----------------"



	except EOFError:
		print "EXITING"
		exit(0)
