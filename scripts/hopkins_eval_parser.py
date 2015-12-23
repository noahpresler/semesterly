import django
from django.db import models
from timetable.models import *
import re

django.setup()

class EvaluationParser:
	def __init__(self):
		self.course_count = 0
		self.eval_update_count = 0
		self.searching = True
		self.evaluated_instructors = ''
		self.instructor_pattern = re.compile(r'^([a-zA-Z-]+\s[a-zA-Z-]+)(?:\,\s([a-zA-Z-]+\s[a-zA-Z-]+))*\r$', re.MULTILINE)
		self.searchfile = open("CourseEvals.txt", "r")

	def add_eval_to_course(self, course_code, eval_score, instructors):
		raw_course_code = re.search(r'^(.{2}\..{3}\..{3}).*$', course_code).group(1).strip('\n')
		if HopkinsCourse.objects.filter(code=raw_course_code + " ").exists():
			course_match = HopkinsCourse.objects.get(code=raw_course_code + " ")
			if ',' in instructors:
				for instructor in instructors.split(','):
					instructor = instructor.strip().strip('\n')
					lastname = re.match(r'[a-zA-Z-]+\s([a-zA-Z-]+)',instructor)
					lastname_pattern = ".*" + lastname.group(1) + ".*"
					if HopkinsCourseOffering.objects.filter(course=course_match, instructors__regex=lastname_pattern):
						for section in HopkinsCourseOffering.objects.filter(course=course_match, instructors__regex=lastname_pattern):
							section.evaluation_score = float(eval_score)
							section.save()
							print "Upadted Course " + raw_course_code + " to eval_score: " + str(section.evaluation_score)
							self.eval_update_count += 1
			else:
				instructors = instructors.strip().strip('\n')
				lastname = re.match(r'[a-zA-Z-]+\s([a-zA-Z-]+)',instructors)
				print lastname.group(1)
				lastname_pattern = ".*" + lastname.group(1) + ".*"
				if HopkinsCourseOffering.objects.filter(course=course_match, instructors__regex=lastname_pattern):
					for section in HopkinsCourseOffering.objects.filter(course=course_match, instructors__regex=lastname_pattern):
						section.evaluation_score = float(eval_score)
						section.save()
						print "Upadted Course " + raw_course_code + " to eval_score: " + str(section.evaluation_score)
						self.eval_update_count += 1


	def pasrse_evals(self):
		for line in self.searchfile:
			if self.searching:
				if re.match(r'^[a-zA-Z]{2}\.[0-9]{3}\.[0-9]{3}\..*$', line) is not None:
					code = line.strip('\n')
					self.searching = False
					self.course_count += 1
			else:
				if re.match(r'^Overall quality of the class\: ([0-9]\.[0-9]{2})', line) is not None:
					course_score = re.search(r'^Overall quality of the class\: ([0-9]\.[0-9]{2})',line).group(1).rstrip('\n')
					self.add_eval_to_course(code, course_score, self.evaluated_instructors)
					self.searching = True
			if self.instructor_pattern.match(line):
				self.evaluated_instructors = line
		print "Courses Parsed: " + str(self.course_count) + " Courses Updated: " + str(self.eval_update_count)

ep = EvaluationParser()
ep.pasrse_evals()