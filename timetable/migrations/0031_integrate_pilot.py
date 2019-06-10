from __future__ import unicode_literals

from django.db import migrations
from timetable.models import Integration, CourseIntegration, Course, Semester, PILOTCourse, PILOTOffering, Section, PILOTSection

def integrate_PILOT(apps, schema_editor):
	integration, created = Integration.objects.get_or_create(name="PILOT")
	integration.save()

	if CourseIntegration.objects.filter(integration=integration).exists():
		for pilot_course in CourseIntegration.objects.filter(integration=integration):
			course_name = pilot_course.course
			course_code = course_name.code
			course_name = course_name.name
			course_id = pilot_course.course_id
			if Course.objects.filter(code=course_code, id=course_id).exists():
				course_object, created = Course.objects.get_or_create(code=course_code, id=course_id)
				if not created:
					course_object.save()
					pre_reqs = course_object.prerequisites
					prof_list = []
					for section in Section.objects.filter(course_id=course_id):
						professor = section.instructors
						if professor not in prof_list:
							prof_list.append(professor)
							for prof in prof_list:
								pilot_course_creation, created = PILOTCourse.objects.get_or_create(name=course_name, course=course_object, code=course_code, prerequisites=pre_reqs, professor=prof)
								pilot_course_creation.save()



class Migration(migrations.Migration):

	dependencies = [
		('timetable', '0032_auto_20190610_2206'),
	]

	operations = [
		migrations.RunPython(integrate_PILOT)
	]
