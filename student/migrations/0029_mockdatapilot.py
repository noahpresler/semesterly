from __future__ import unicode_literals

from django.db import migrations, models
from timetable.models import Integration, Course, Semester, Section, CourseIntegration


def add_mock(apps, schema_editor):
	""" PILOT classes for Spring 2019"""
	pilot_codes = [
		"AS.110.106",
		"AS.110.107",
		"AS.110.109",
		"AS.110.202",
		"AS.110.201",
		"AS.110.302",
		"EN.553.171",
		"EN.500.112",
		"EN.553.111",
		"EN.553.112",
		"AS.280.350",
		"AS.030.102",
		"AS.030.206",
		"AS.180.102",
		"AS.171.101",
		"AS.171.102",
		"AS.171.104",
		"AS.171.108",
		"EN.625.109"
	]

	integration, created = Integration.objects.get_or_create(name="PILOT")
	integration.save()
	PilotOffering = apps.get_model('student', 'PilotOffering')
	if Semester.objects.filter(year="2020", name="Spring").exists():
		s20 = Semester.objects.get(year="2020", name="Spring")
		for code in pilot_codes:
			if Course.objects.filter(school="jhu", code=code).exists():
				course = Course.objects.get(school="jhu", code=code)
				courseint, created = CourseIntegration.objects.get_or_create(course_id=course.id, integration_id=integration.id)
				courseint.semester.add(s20)
				courseint.save()
				if Section.objects.filter(course_id=course.id, semester=s20).exists():
					sections = list(Section.objects.filter(course_id=course.id, semester=s20))
					for section in sections:
						offering1, created = PilotOffering.objects.get_or_create(day='M', time_start="5:00pm", time_end="7:00pm", size=10, course_name=course.name)
						offering1.sections.add(section.id)
						offering1.save()
						offering2, created = PilotOffering.objects.get_or_create(day='T', time_start="5:00pm", time_end="7:00pm", size=10,course_name=course.name)
						offering2.sections.add(section.id)
						offering2.save()
						offering3, created = PilotOffering.objects.get_or_create(day='W', time_start="5:00pm", time_end="7:00pm", size=10,course_name=course.name)
						offering3.sections.add(section.id)
						offering3.save()



class Migration(migrations.Migration):

	dependencies = [
		('student', '0028_pilotoffering_course_name'),
	]

	operations = [
		migrations.RunPython(add_mock)
	]