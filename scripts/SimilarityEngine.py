from timetable.models import *
import django
import re
import sys
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
import nltk
from nltk.corpus import stopwords
from django.contrib.contenttypes.models import ContentType

django.setup()

school_course_map = {'hopkins': 'HopkinsCourse', 
            'uoft': 'Course'}

class SimilarityFinder:

	def __init__(self):
		self.cachedStopWords = stopwords.words("english")
		self.mode_type = ""
		if len(sys.argv) != 2:
			print "Please provide a university."
			exit()
		elif len(sys.argv) == 2: 
			try:
				self.model_type = school_course_map[str(sys.argv[1])]
				self.ctype = ContentType.objects.get(model=self.model_type.lower())
			except:
				print "Invalid school."
				print school_course_map
				exit()
		self.unstop_descriptions()
		self.courses = self.ctype.model_class().objects.all()

	def parse_classes(self):
		for course in self.courses:
			if course.description not in ["Infomration not required for this course type","Not Available","None provided"]:
				department_matches = course.get_dept_matches().values_list('description', flat=True)
				matches = process.extract(course.description,department_matches, limit=4)
				try:
					itermatches = iter(matches)
					next(itermatches)
				except:
					continue
				for match in itermatches:
					course_match = self.ctype.model_class().objects.filter(description=match[0])[0]
					try:
						print "PREVIOUSLY related " + course_match.name + " to " + course.name
						course.related_courses.get(code=course_match.code)
					except self.ctype.model_class().DoesNotExist:
						print "ADDING " + course_match.name + " as related to " + course.name
						course.related_courses.add(course_match)

	def unstop_descriptions(self):
		courses = self.ctype.model_class().objects.filter(unstopped_description="")
		for course in courses:
			print "Unstopping: " + course.name
			course.unstopped_description = ' '.join([word for word in course.description.split() if word not in (self.cachedStopWords)])
			course.save()
			print course.unstopped_description

cf = SimilarityFinder()
cf.parse_classes()
