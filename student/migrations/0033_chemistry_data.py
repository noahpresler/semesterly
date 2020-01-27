from __future__ import unicode_literals

from django.db import migrations, models
from timetable.models import Integration, Course, Semester, Section, CourseIntegration
from django.shortcuts import get_object_or_404

def add_mock(apps, schema_editor):
	""" PILOT classes for Spring 2019"""
	pilot_codes = [
		"AS.030.102", #dr sunita (02) // dr Karlin
		"AS.030.206" #falzone (1,2), Lecta (3-16)
	]

	integration = get_object_or_404(Integration, name="PILOT")
	integration.save()
	PilotOffering = apps.get_model('student', 'PilotOffering')
	s20 = Semester.objects.get(year="2020", name="Spring")

	course0 = Course.objects.get(code=pilot_codes[0], )
	course1 = Course.objects.get(code=pilot_codes[1])



class Migration(migrations.Migration):

	dependencies = [
		('student', '0028_pilotoffering_course_name'),
	]

	operations = [
		migrations.RunPython(add_mock)
	]