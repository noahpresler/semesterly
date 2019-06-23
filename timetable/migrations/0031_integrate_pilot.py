from __future__ import unicode_literals

from django.db import migrations
from timetable.models import Integration, CourseIntegration, Course, Semester, PILOTCourse, PILOTOffering, Section, PILOTSection

def integrate_PILOT(apps, schema_editor):

	# Find integration for PILOT supported courses
	integration, created = Integration.objects.get_or_create(name="PILOT")
	integration.save()

	#Loop through each PILOT supported course and grab the course ID
	if CourseIntegration.objects.filter(integration=integration).exists():
		for pilot_course in CourseIntegration.objects.filter(integration=integration):
			course_id = pilot_course.course_id
			#Get the course with this course ID, grab professors
			if Course.objects.filter(id=course_id).exists():
				course_object, created = Course.objects.get_or_create(id=course_id)
				if not created:
					course_object.save()
					prof_list = []
					#Filter through sections, create a list of possible professors
					for section in Section.objects.filter(course_id=course_id):
						professor = section.instructors
						if professor not in prof_list:
							prof_list.append(professor)
					# prof_list should now be populated with all possible professors
					for prof in prof_list:
						pilot_course_creation, created = PILOTCourse.objects.get_or_create(course=course_object, professor=prof)
						pilot_course_creation.save()

# Maybe creating a model that is a subclass of Course that holds the professors,
# and the reference to the course.
# Should it also contain a reference to a student list? students ENROLLED then students
#on the WAITLIST


class Migration(migrations.Migration):

	dependencies = [
		('timetable', '0032_auto_20190610_2206'),
	]

	operations = [
		migrations.RunPython(integrate_PILOT)
	]
