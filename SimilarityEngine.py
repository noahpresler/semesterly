from timetable.models import *
import django
import re
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

django.setup()

class SimilarityFinder:

    def __init__(self):
    	self.courses = HopkinsCourse.objects.all()
    	self.code_pattern = re.compile(r"(.*\..*)\.(.*)")

    def parse_classes(self):
    	for course in self.courses:
    		if course.description not in ["Infomration not required for this course type","Not Available","None provided"]:
				department = re.search(self.code_pattern,course.get_code()).group(1)
				department_matches = HopkinsCourse.objects.filter(code__contains=department).values_list('description', flat=True)
				matches = process.extract(course.description,department_matches, limit=4)
				try:
					itermatches = iter(matches)
					next(itermatches)
				except:
					continue
				for match in itermatches:
					course_match = HopkinsCourse.objects.filter(description=match[0])[0]
					try:
						print "PREVIOUSLY related " + course_match.name + " to " + course.name
						course.related_courses.get(code=course_match.code)
					except HopkinsCourse.DoesNotExist:
						print "ADDING " + course_match.name + " as related to " + course.name
						course.related_courses.add(course_match)

cf = SimilarityFinder()
cf.parse_classes()